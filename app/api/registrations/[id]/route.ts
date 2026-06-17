import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Session from '@/models/Session';
import { broadcastUpdate } from '@/lib/sse';

// Normalize phone number to +628XXXXXXXXX format
function normalizePhoneNumber(phone: string): string {
  if (!phone || !phone.trim()) return phone;
  let cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.match(/^\+628\d+$/)) return cleaned;
  cleaned = cleaned.replace(/\+/g, '');
  if (cleaned.startsWith('62')) return '+' + cleaned;
  if (cleaned.startsWith('0')) return '+62' + cleaned.substring(1);
  if (cleaned.startsWith('8')) return '+62' + cleaned;
  return phone;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const { fullName, phoneNumber, grade, sessionId, bypassLimit } = body;

    // Validate input
    if (!fullName || !phoneNumber || !grade || !sessionId) {
      return NextResponse.json(
        { success: false, error: 'Semua field diperlukan' },
        { status: 400 }
      );
    }

    // Normalize and validate phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone.startsWith('+62')) {
      return NextResponse.json(
        { success: false, error: 'Format nomor telepon tidak valid' },
        { status: 400 }
      );
    }

    // Find the session currently containing this registration
    const currentSession = await Session.findOne({ 'registrations._id': id });
    if (!currentSession) {
      return NextResponse.json(
        { success: false, error: 'Pendaftaran tidak ditemukan' },
        { status: 404 }
      );
    }

    const oldSessionId = currentSession._id.toString();
    const newSessionId = sessionId;
    const isSessionChanging = oldSessionId !== newSessionId;

    if (isSessionChanging) {
      // Find and validate the new session
      const newSession = await Session.findById(newSessionId);
      if (!newSession) {
        return NextResponse.json(
          { success: false, error: 'Sesi tidak ditemukan' },
          { status: 404 }
        );
      }

      // Check capacity in new session (unless bypassLimit)
      if (!bypassLimit && newSession.registrations.length >= newSession.limit) {
        return NextResponse.json(
          { success: false, error: 'Sesi sudah penuh' },
          { status: 400 }
        );
      }

      // Check for duplicate name in the new session
      const duplicateInNewSession = newSession.registrations.some(
        (r) => r.fullName.trim().toLowerCase() === fullName.trim().toLowerCase()
      );
      if (duplicateInNewSession) {
        return NextResponse.json(
          { success: false, error: `Nama "${fullName}" sudah terdaftar di sesi ini` },
          { status: 409 }
        );
      }

      // Pull from old session, push to new session
      await Session.findByIdAndUpdate(oldSessionId, {
        $pull: { registrations: { _id: id } },
      });
      await Session.findByIdAndUpdate(newSessionId, {
        $push: {
          registrations: {
            _id: id,
            fullName,
            phoneNumber: normalizedPhone,
            grade,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      });
    } else {
      // Same session — check for duplicate name excluding this registration
      const duplicateInSession = currentSession.registrations.some(
        (r) =>
          r._id!.toString() !== id &&
          r.fullName.trim().toLowerCase() === fullName.trim().toLowerCase()
      );
      if (duplicateInSession) {
        return NextResponse.json(
          { success: false, error: `Nama "${fullName}" sudah terdaftar di sesi ini` },
          { status: 409 }
        );
      }

      // Update the subdocument in-place
      await Session.findOneAndUpdate(
        { 'registrations._id': id },
        {
          $set: {
            'registrations.$.fullName': fullName,
            'registrations.$.phoneNumber': normalizedPhone,
            'registrations.$.grade': grade,
            'registrations.$.updatedAt': new Date(),
          },
        }
      );
    }

    broadcastUpdate('all');

    return NextResponse.json({
      success: true,
      message: 'Pendaftaran berhasil diperbarui',
    });
  } catch (error: any) {
    console.error('Error updating registration:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memperbarui pendaftaran' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    // Pull the registration subdocument from whichever session contains it
    const session = await Session.findOneAndUpdate(
      { 'registrations._id': id },
      { $pull: { registrations: { _id: id } } }
    );

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Pendaftaran tidak ditemukan' },
        { status: 404 }
      );
    }

    broadcastUpdate('all');

    return NextResponse.json({
      success: true,
      message: 'Pendaftaran berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting registration:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus pendaftaran' },
      { status: 500 }
    );
  }
}

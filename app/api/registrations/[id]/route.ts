import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Registration from '@/models/Registration';
import Session from '@/models/Session';
import { broadcastUpdate } from '@/lib/sse';

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

    // Find the registration
    const registration = await Registration.findById(id);
    if (!registration) {
      return NextResponse.json(
        { success: false, error: 'Pendaftaran tidak ditemukan' },
        { status: 404 }
      );
    }

    const oldSessionId = registration.sessionId.toString();
    const newSessionId = sessionId;

    // If session changed, update registration counts
    if (oldSessionId !== newSessionId) {
      // Check if new session exists and has space
      const newSession = await Session.findById(newSessionId);
      if (!newSession) {
        return NextResponse.json(
          { success: false, error: 'Sesi tidak ditemukan' },
          { status: 404 }
        );
      }

      // Only check capacity limit if bypassLimit is not true
      if (!bypassLimit && newSession.currentRegistrations >= newSession.limit) {
        return NextResponse.json(
          { success: false, error: 'Sesi sudah penuh' },
          { status: 400 }
        );
      }

      // Decrease old session count
      await Session.findByIdAndUpdate(oldSessionId, {
        $inc: { currentRegistrations: -1 },
      });

      // Increase new session count
      await Session.findByIdAndUpdate(newSessionId, {
        $inc: { currentRegistrations: 1 },
      });
    }

    // Update the registration
    const updatedRegistration = await Registration.findByIdAndUpdate(
      id,
      { fullName, phoneNumber, grade, sessionId },
      { new: true, runValidators: true }
    );

    // Broadcast update to all connected clients
    broadcastUpdate('all');

    return NextResponse.json({
      success: true,
      message: 'Pendaftaran berhasil diperbarui',
      registration: updatedRegistration,
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

    // Find the registration
    const registration = await Registration.findById(id);
    if (!registration) {
      return NextResponse.json(
        { success: false, error: 'Pendaftaran tidak ditemukan' },
        { status: 404 }
      );
    }

    // Decrease session registration count
    await Session.findByIdAndUpdate(registration.sessionId, {
      $inc: { currentRegistrations: -1 },
    });

    // Delete the registration
    await Registration.findByIdAndDelete(id);

    // Broadcast update to all connected clients
    broadcastUpdate('all');

    return NextResponse.json({
      success: true,
      message: 'Pendaftaran berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting registration:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus pendaftaran' },
      { status: 500 }
    );
  }
}

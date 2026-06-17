import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Session from '@/models/Session';
import mongoose from 'mongoose';
import { broadcastUpdate } from '@/lib/sse';

// Normalize phone number to +628XXXXXXXXX format
function normalizePhoneNumber(phone: string): string {
  if (!phone || !phone.trim()) return phone;

  // Remove all spaces, dashes, parentheses, and other non-numeric characters except +
  let cleaned = phone.replace(/[\s\-()]/g, '');

  // If already in correct format, return as is
  if (cleaned.match(/^\+628\d+$/)) {
    return cleaned;
  }

  // Remove any + symbols and leading zeros to work with just numbers
  cleaned = cleaned.replace(/\+/g, '');

  // Handle different starting patterns
  if (cleaned.startsWith('62')) {
    // Already has country code (62xxx...)
    return '+' + cleaned;
  } else if (cleaned.startsWith('0')) {
    // Starts with 0 (08xxx...) - remove the 0 and add +62
    return '+62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    // Starts with 8 (8xxx...) - add +62
    return '+62' + cleaned;
  }

  // If it doesn't match expected patterns, return original
  return phone;
}

export async function GET() {
  try {
    await dbConnect();
    const sessions = await Session.find({});

    const registrations = sessions.flatMap((session) =>
      session.registrations.map((reg) => ({
        _id: reg._id,
        fullName: reg.fullName,
        phoneNumber: reg.phoneNumber,
        grade: reg.grade,
        sessionId: session._id,
        sessionName: session.name,
        sessionDate: session.date,
        sessionTime: session.time,
        createdAt: reg.createdAt,
      }))
    );

    return NextResponse.json({ success: true, registrations });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data pendaftaran' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { students, phoneNumber, sessionId, bypassLimit } = body;

    // Validate input
    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Minimal satu siswa diperlukan' },
        { status: 400 }
      );
    }

    if (!phoneNumber || !sessionId) {
      return NextResponse.json(
        { success: false, error: 'Nomor telepon dan sesi diperlukan' },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

    // Validate normalized phone number
    if (!normalizedPhoneNumber.startsWith('+62')) {
      return NextResponse.json(
        { success: false, error: 'Format nomor telepon tidak valid' },
        { status: 400 }
      );
    }

    // Validate each student
    for (const student of students) {
      if (!student.fullName || !student.grade) {
        return NextResponse.json(
          { success: false, error: 'Setiap siswa harus memiliki nama lengkap dan kelas' },
          { status: 400 }
        );
      }
    }

    // Check if session exists and has capacity
    const session = await Session.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesi tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if session has enough capacity for all students (unless bypassLimit is true)
    if (!bypassLimit) {
      const availableSpots = session.limit - session.registrations.length;
      if (availableSpots < students.length) {
        return NextResponse.json(
          { success: false, error: `Sesi hanya memiliki ${availableSpots} tempat tersedia, tetapi Anda mencoba mendaftarkan ${students.length} siswa` },
          { status: 400 }
        );
      }
    }

    // Check for duplicate names within this session
    const incomingNames = students.map((s: { fullName: string; grade: string }) =>
      s.fullName.trim().toLowerCase()
    );

    // Check duplicates among the submitted students themselves
    const uniqueIncoming = new Set(incomingNames);
    if (uniqueIncoming.size !== incomingNames.length) {
      return NextResponse.json(
        { success: false, error: 'Terdapat nama siswa yang duplikat dalam formulir pendaftaran ini' },
        { status: 409 }
      );
    }

    // Check against names already registered in the same session
    const existingNames = session.registrations.map((r) =>
      r.fullName.trim().toLowerCase()
    );

    const duplicates = incomingNames.filter((name: string) => existingNames.includes(name));
    if (duplicates.length > 0) {
      const displayNames = students
        .filter((s: { fullName: string; grade: string }) =>
          duplicates.includes(s.fullName.trim().toLowerCase())
        )
        .map((s: { fullName: string; grade: string }) => s.fullName)
        .join(', ');
      return NextResponse.json(
        { success: false, error: `Nama berikut sudah terdaftar di sesi ini: ${displayNames}` },
        { status: 409 }
      );
    }

    // Build new registration entries with pre-assigned IDs and timestamps
    const now = new Date();
    const newEntries = students.map((student: { fullName: string; grade: string }) => ({
      _id: new mongoose.Types.ObjectId(),
      fullName: student.fullName,
      phoneNumber: normalizedPhoneNumber,
      grade: student.grade,
      createdAt: now,
      updatedAt: now,
    }));

    // Push entries into the session's registrations array
    await Session.findByIdAndUpdate(sessionId, {
      $push: { registrations: { $each: newEntries } },
    });

    broadcastUpdate('all');

    return NextResponse.json({ success: true, registrations: newEntries, count: newEntries.length }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating registration:', error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      return NextResponse.json(
        { success: false, error: `Validasi gagal: ${messages.join(', ')}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Gagal membuat pendaftaran' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await dbConnect();

    // Count total registrations across all sessions before clearing
    const sessions = await Session.find({}, { registrations: 1 });
    const deletedCount = sessions.reduce((sum, s) => sum + s.registrations.length, 0);

    // Clear the embedded registrations array from every session
    await Session.updateMany({}, { $set: { registrations: [] } });

    broadcastUpdate('all');

    return NextResponse.json({
      success: true,
      message: 'Semua pendaftaran berhasil dihapus',
      deletedCount,
    });
  } catch (error) {
    console.error('Error deleting all registrations:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus pendaftaran' },
      { status: 500 }
    );
  }
}

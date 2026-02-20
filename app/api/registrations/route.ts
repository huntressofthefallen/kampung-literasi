import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Registration from '@/models/Registration';
import Session from '@/models/Session';
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
    const registrations = await Registration.find({}).populate('sessionId');

    // Format the response with session details
    const formattedRegistrations = registrations.map((reg: any) => ({
      _id: reg._id,
      fullName: reg.fullName,
      phoneNumber: reg.phoneNumber,
      grade: reg.grade,
      sessionId: reg.sessionId._id,
      sessionName: reg.sessionId.name,
      sessionDate: reg.sessionId.date,
      sessionTime: reg.sessionId.time,
      createdAt: reg.createdAt,
    }));

    return NextResponse.json({ success: true, registrations: formattedRegistrations });
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
    const { students, phoneNumber, sessionId } = body;

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

    // Check if session has enough capacity for all students
    const availableSpots = session.limit - session.currentRegistrations;
    if (availableSpots < students.length) {
      return NextResponse.json(
        { success: false, error: `Sesi hanya memiliki ${availableSpots} tempat tersedia, tetapi Anda mencoba mendaftarkan ${students.length} siswa` },
        { status: 400 }
      );
    }

    // Create registrations for all students
    const registrations = await Promise.all(
      students.map((student: { fullName: string; grade: string }) =>
        Registration.create({
          fullName: student.fullName,
          phoneNumber: normalizedPhoneNumber,
          grade: student.grade,
          sessionId,
        })
      )
    );

    // Update session count by the number of students
    await Session.findByIdAndUpdate(sessionId, {
      $inc: { currentRegistrations: students.length },
    });

    // Broadcast update to all connected clients
    broadcastUpdate('all');

    return NextResponse.json({ success: true, registrations, count: students.length }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating registration:', error);

    return NextResponse.json(
      { success: false, error: 'Gagal membuat pendaftaran' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await dbConnect();

    // Get all registrations to update session counts
    const registrations = await Registration.find({});

    // Group registrations by session
    const sessionCounts: { [key: string]: number } = {};
    registrations.forEach((reg: any) => {
      const sessionId = reg.sessionId.toString();
      sessionCounts[sessionId] = (sessionCounts[sessionId] || 0) + 1;
    });

    // Delete all registrations
    await Registration.deleteMany({});

    // Reset session registration counts
    await Session.updateMany({}, { $set: { currentRegistrations: 0 } });

    // Broadcast update to all connected clients
    broadcastUpdate('all');

    return NextResponse.json({
      success: true,
      message: 'Semua pendaftaran berhasil dihapus',
      deletedCount: registrations.length
    });
  } catch (error) {
    console.error('Error deleting all registrations:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus pendaftaran' },
      { status: 500 }
    );
  }
}

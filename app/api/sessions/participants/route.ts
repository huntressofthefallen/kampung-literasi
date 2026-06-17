import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Session from '@/models/Session';

export async function GET() {
  try {
    await dbConnect();

    const sessions = await Session.find({ isActive: true }).sort({ date: 1 });

    const result = sessions.map((session) => ({
      _id: session._id,
      name: session.name,
      date: session.date,
      time: session.time,
      limit: session.limit,
      currentRegistrations: session.registrations.length,
      participants: [...session.registrations]
        .sort((a, b) => a.fullName.localeCompare(b.fullName))
        .map((r) => ({
          fullName: r.fullName,
          grade: r.grade,
        })),
    }));

    return NextResponse.json({ success: true, sessions: result });
  } catch (error) {
    console.error('Error fetching session participants:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data peserta' },
      { status: 500 }
    );
  }
}

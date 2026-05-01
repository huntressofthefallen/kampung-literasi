import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Session from '@/models/Session';
import Registration from '@/models/Registration';

export async function GET() {
  try {
    await dbConnect();

    const sessions = await Session.find({ isActive: true }).sort({ date: 1 });

    const result = await Promise.all(
      sessions.map(async (session) => {
        const registrations = await Registration.find(
          { sessionId: session._id },
          { fullName: 1, grade: 1, _id: 0 }
        ).sort({ fullName: 1 });

        return {
          _id: session._id,
          name: session.name,
          date: session.date,
          time: session.time,
          limit: session.limit,
          currentRegistrations: session.currentRegistrations,
          participants: registrations.map((r) => ({
            fullName: r.fullName,
            grade: r.grade,
          })),
        };
      })
    );

    return NextResponse.json({ success: true, sessions: result });
  } catch (error) {
    console.error('Error fetching session participants:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data peserta' },
      { status: 500 }
    );
  }
}

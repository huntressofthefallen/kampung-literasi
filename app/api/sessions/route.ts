import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Session from '@/models/Session';
import { broadcastUpdate } from '@/lib/sse';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('all') === 'true';
    const query = showAll ? {} : { isActive: true };
    const sessions = await Session.find(query).sort({ date: 1 });
    return NextResponse.json({ success: true, sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data sesi' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { name, date, time, limit } = body;

    if (!name || !date || !time || !limit) {
      return NextResponse.json(
        { success: false, error: 'Semua bidang wajib diisi' },
        { status: 400 }
      );
    }

    const session = await Session.create({
      name,
      date: new Date(date),
      time,
      limit: parseInt(limit, 10),
      currentRegistrations: 0,
    });

    // Broadcast update to all connected clients
    broadcastUpdate('sessions');

    return NextResponse.json({ success: true, session }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal membuat sesi' },
      { status: 500 }
    );
  }
}

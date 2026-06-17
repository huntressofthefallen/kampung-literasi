import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Session from '@/models/Session';
import { broadcastUpdate } from '@/lib/sse';

function formatSession(s: any) {
  return {
    _id: s._id,
    name: s.name,
    date: s.date,
    time: s.time,
    limit: s.limit,
    isActive: s.isActive,
    currentRegistrations: s.registrations.length,
    createdAt: s.createdAt,
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const session = await Session.findById(id);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesi tidak ditemukan' },
        { status: 404 }
      );
    }

    const updatedSession = await Session.findByIdAndUpdate(
      id,
      { isActive: !session.isActive },
      { new: true }
    );

    broadcastUpdate('sessions');

    return NextResponse.json({ success: true, session: formatSession(updatedSession) });
  } catch (error) {
    console.error('Error toggling session:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengubah status sesi' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const { name, date, time, limit } = body;

    const session = await Session.findByIdAndUpdate(
      id,
      {
        name,
        date: new Date(date),
        time,
        limit: parseInt(limit, 10),
      },
      { new: true, runValidators: true }
    );

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesi tidak ditemukan' },
        { status: 404 }
      );
    }

    broadcastUpdate('sessions');

    return NextResponse.json({ success: true, session: formatSession(session) });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui sesi' },
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
    const session = await Session.findByIdAndDelete(id);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesi tidak ditemukan' },
        { status: 404 }
      );
    }

    // Registrations are embedded — deleted automatically with the session document.
    broadcastUpdate('sessions');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus sesi' },
      { status: 500 }
    );
  }
}

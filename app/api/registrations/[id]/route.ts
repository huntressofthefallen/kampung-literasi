import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Registration from '@/models/Registration';
import Session from '@/models/Session';
import { broadcastUpdate } from '@/lib/sse';

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

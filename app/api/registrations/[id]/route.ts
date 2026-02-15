import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Registration from '@/models/Registration';
import Session from '@/models/Session';

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
        { success: false, error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Decrease session registration count
    await Session.findByIdAndUpdate(registration.sessionId, {
      $inc: { currentRegistrations: -1 },
    });

    // Delete the registration
    await Registration.findByIdAndDelete(id);

    return NextResponse.json({ 
      success: true, 
      message: 'Registration deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting registration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete registration' },
      { status: 500 }
    );
  }
}

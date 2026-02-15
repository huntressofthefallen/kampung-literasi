import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Registration from '@/models/Registration';
import Session from '@/models/Session';

export async function GET() {
  try {
    await dbConnect();
    const registrations = await Registration.find({}).populate('sessionId');

    // Format the response with session details
    const formattedRegistrations = registrations.map((reg: any) => ({
      _id: reg._id,
      fullName: reg.fullName,
      email: reg.email,
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
      { success: false, error: 'Failed to fetch registrations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { fullName, email, phoneNumber, grade, sessionId } = body;

    if (!fullName || !email || !phoneNumber || !grade || !sessionId) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if person already registered
    const existingRegistration = await Registration.findOne({ fullName });
    if (existingRegistration) {
      return NextResponse.json(
        { success: false, error: 'This person is already registered for a session' },
        { status: 400 }
      );
    }

    // Check if session exists and has capacity
    const session = await Session.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.currentRegistrations >= session.limit) {
      return NextResponse.json(
        { success: false, error: 'Session is full' },
        { status: 400 }
      );
    }

    // Create registration
    const registration = await Registration.create({
      fullName,
      email,
      phoneNumber,
      grade,
      sessionId,
    });

    // Update session count
    await Session.findByIdAndUpdate(sessionId, {
      $inc: { currentRegistrations: 1 },
    });

    return NextResponse.json({ success: true, registration }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating registration:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'This person is already registered for a session' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create registration' },
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

    return NextResponse.json({
      success: true,
      message: 'All registrations deleted successfully',
      deletedCount: registrations.length
    });
  } catch (error) {
    console.error('Error deleting all registrations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete registrations' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Registration from '@/models/Registration';
import Session from '@/models/Session';
import { broadcastUpdate } from '@/lib/sse';

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
      { success: false, error: 'Failed to fetch registrations' },
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
        { success: false, error: 'At least one student is required' },
        { status: 400 }
      );
    }

    if (!phoneNumber || !sessionId) {
      return NextResponse.json(
        { success: false, error: 'Phone number and session are required' },
        { status: 400 }
      );
    }

    // Validate each student
    for (const student of students) {
      if (!student.fullName || !student.grade) {
        return NextResponse.json(
          { success: false, error: 'Each student must have a full name and grade' },
          { status: 400 }
        );
      }
    }

    // Check if session exists and has capacity
    const session = await Session.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if session has enough capacity for all students
    const availableSpots = session.limit - session.currentRegistrations;
    if (availableSpots < students.length) {
      return NextResponse.json(
        { success: false, error: `Session only has ${availableSpots} spot(s) available, but you're trying to register ${students.length} student(s)` },
        { status: 400 }
      );
    }

    // Create registrations for all students
    const registrations = await Promise.all(
      students.map((student: { fullName: string; grade: string }) =>
        Registration.create({
          fullName: student.fullName,
          phoneNumber,
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

    // Broadcast update to all connected clients
    broadcastUpdate('all');

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

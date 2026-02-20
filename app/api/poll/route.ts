import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Registration from '@/models/Registration';
import Session from '@/models/Session';

// Revalidate every 1 second (adjust as needed)
export const revalidate = 1;

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const lastCheck = searchParams.get('lastCheck');
    const lastCheckTime = lastCheck ? new Date(parseInt(lastCheck)) : new Date(0);

    // Check if there are any updates since lastCheck
    const [recentRegistrations, recentSessions] = await Promise.all([
      Registration.countDocuments({
        updatedAt: { $gt: lastCheckTime }
      }),
      Session.countDocuments({
        updatedAt: { $gt: lastCheckTime }
      })
    ]);

    const hasUpdates = recentRegistrations > 0 || recentSessions > 0;

    return NextResponse.json({
      hasUpdates,
      timestamp: Date.now(),
      updates: {
        registrations: recentRegistrations > 0,
        sessions: recentSessions > 0
      }
    });
  } catch (error) {
    console.error('[Polling] Error:', error);
    return NextResponse.json(
      { error: 'Gagal memeriksa pembaruan' },
      { status: 500 }
    );
  }
}

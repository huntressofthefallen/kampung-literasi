import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Session from '@/models/Session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const lastCheck = searchParams.get('lastCheck');
    const lastCheckTime = lastCheck ? new Date(parseInt(lastCheck)) : new Date(0);

    // Registrations are embedded in sessions — a session update covers both
    const recentSessions = await Session.countDocuments({
      updatedAt: { $gt: lastCheckTime }
    });

    const hasUpdates = recentSessions > 0;

    return NextResponse.json({
      hasUpdates,
      timestamp: Date.now(),
      updates: {
        registrations: hasUpdates,
        sessions: hasUpdates,
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

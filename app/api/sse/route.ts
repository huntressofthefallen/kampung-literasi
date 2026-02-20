import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Registration from '@/models/Registration';
import Session from '@/models/Session';

// Cannot use Edge runtime with MongoDB Change Streams
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Vercel timeout: Increase to max for your plan (10s free, 60s hobby+)
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  // Track if stream is still active
  let isActive = true;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await dbConnect();

        // Send initial connection message
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

        // Setup Change Streams for real-time MongoDB updates
        const registrationStream = Registration.watch([], {
          fullDocument: 'updateLookup'
        });

        const sessionStream = Session.watch([], {
          fullDocument: 'updateLookup'
        });

        // Handle registration changes
        registrationStream.on('change', (change) => {
          if (!isActive) return;
          try {
            const message = encoder.encode(`data: ${JSON.stringify({
              type: 'registrations',
              operation: change.operationType,
              timestamp: Date.now()
            })}\n\n`);
            controller.enqueue(message);
          } catch (error) {
            console.error('[SSE] Error sending registration update:', error);
          }
        });

        // Handle session changes
        sessionStream.on('change', (change) => {
          if (!isActive) return;
          try {
            const message = encoder.encode(`data: ${JSON.stringify({
              type: 'sessions',
              operation: change.operationType,
              timestamp: Date.now()
            })}\n\n`);
            controller.enqueue(message);
          } catch (error) {
            console.error('[SSE] Error sending session update:', error);
          }
        });

        // Send heartbeat to keep connection alive
        const heartbeat = setInterval(() => {
          if (!isActive) {
            clearInterval(heartbeat);
            return;
          }
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`));
          } catch (error) {
            clearInterval(heartbeat);
          }
        }, 15000);

        // Handle stream errors
        registrationStream.on('error', (error) => {
          console.error('[SSE] Registration stream error:', error);
        });

        sessionStream.on('error', (error) => {
          console.error('[SSE] Session stream error:', error);
        });

        // Cleanup on disconnect
        request.signal.addEventListener('abort', () => {
          isActive = false;
          clearInterval(heartbeat);
          registrationStream.close();
          sessionStream.close();
          try {
            controller.close();
          } catch (error) {
            // Already closed
          }
        });

      } catch (error) {
        console.error('[SSE] Setup error:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          message: 'Failed to setup real-time connection'
        })}\n\n`));
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

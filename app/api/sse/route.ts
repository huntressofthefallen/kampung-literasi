import { NextRequest } from 'next/server';
import { addClient, removeClient } from '@/lib/sse';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Add this client to the set
      addClient(controller);

      // Send initial connection message
      const data = encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
      controller.enqueue(data);

      // Send heartbeat every 15 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          const data = encoder.encode(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`);
          controller.enqueue(data);
        } catch (error) {
          clearInterval(heartbeat);
        }
      }, 15000);

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        removeClient(controller);
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch (error) {
          // Connection already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

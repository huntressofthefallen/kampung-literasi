// Store active SSE connections
let clients: ReadableStreamDefaultController[] = [];

export function addClient(controller: ReadableStreamDefaultController) {
  clients.push(controller);
}

export function removeClient(controller: ReadableStreamDefaultController) {
  clients = clients.filter(c => c !== controller);
}

export function broadcastUpdate(type: 'sessions' | 'registrations' | 'all') {
  const encoder = new TextEncoder();
  const message = encoder.encode(`data: ${JSON.stringify({ type, timestamp: Date.now() })}\n\n`);

  clients = clients.filter((controller) => {
    try {
      controller.enqueue(message);
      return true;
    } catch (error) {
      // Client disconnected
      return false;
    }
  });
}

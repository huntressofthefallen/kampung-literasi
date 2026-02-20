// This file is now deprecated - we use MongoDB Change Streams directly in the SSE endpoint
// No need for manual broadcasting as database changes are automatically detected

export function addClient(controller: ReadableStreamDefaultController) {
  // Deprecated - kept for backward compatibility
}

export function removeClient(controller: ReadableStreamDefaultController) {
  // Deprecated - kept for backward compatibility
}

export function broadcastUpdate(type: 'sessions' | 'registrations' | 'all') {
  // Deprecated - MongoDB Change Streams handle this automatically
  // This function is now a no-op
}

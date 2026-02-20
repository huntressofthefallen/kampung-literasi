# Real-time Updates with MongoDB Change Streams

## Solution: SSE with MongoDB Change Streams

This app uses **Server-Sent Events (SSE)** powered by **MongoDB Change Streams** for true real-time updates without polling intervals. This provides WebSocket-like functionality while being simpler to implement.

## How It Works

1. **Client connects** to `/api/sse` endpoint via EventSource
2. **Server watches MongoDB** using Change Streams on `registrations` and `sessions` collections
3. **Database changes trigger** immediate notifications to all connected clients
4. **Client receives** update event and refreshes data

### Architecture

```
User Action → API Route → MongoDB Update → Change Stream Event → SSE Push → Client Refresh
```

**No polling intervals!** Updates are pushed instantly when data changes.

## MongoDB Requirements

**Change Streams require a MongoDB Replica Set.** This is automatically available on:

- ✅ MongoDB Atlas (all tiers, including free M0)
- ✅ MongoDB Cloud hosted instances
- ❌ Local standalone MongoDB (development only)

For local development without replica set, you can:

1. Use MongoDB Atlas free tier
2. Set up local replica set: https://www.mongodb.com/docs/manual/tutorial/deploy-replica-set/
3. Use Docker with replica set: `docker-compose` with MongoDB replica set configuration

## Implementation Details

### Server-Side: [app/api/sse/route.ts](app/api/sse/route.ts)

```typescript
// Watches MongoDB collections for changes
const registrationStream = Registration.watch([], {
	fullDocument: "updateLookup",
});

// Pushes updates through SSE when changes occur
registrationStream.on("change", (change) => {
	controller.enqueue(
		encoder.encode(
			`data: ${JSON.stringify({
				type: "registrations",
				operation: change.operationType,
			})}\n\n`,
		),
	);
});
```

### Client-Side: EventSource API

```typescript
const eventSource = new EventSource("/api/sse");

eventSource.onmessage = (event) => {
	const data = JSON.parse(event.data);

	if (data.type === "sessions" || data.type === "registrations") {
		// Refresh your data
		fetchData();
	}
};
```

## Vercel Deployment Considerations

### Timeout Limits

Change the `maxDuration` in [app/api/sse/route.ts](app/api/sse/route.ts#L9) based on your Vercel plan:

```typescript
export const maxDuration = 60; // Free: 10s, Hobby: 10s, Pro: 60s, Enterprise: 900s
```

When the timeout is reached, the connection closes and the browser **automatically reconnects** (EventSource handles this).

### Why This Works on Vercel

Unlike the previous in-memory approach:

- ✅ **No shared state needed** - Each SSE connection watches MongoDB directly
- ✅ **Database is the source of truth** - All instances see the same changes
- ✅ **Real-time, not polling** - MongoDB pushes changes, not pull-based
- ✅ **Automatic reconnection** - EventSource API handles reconnects

## Performance & Scaling

### Connection Overhead

- Each connected client = 1 MongoDB Change Stream
- Lightweight - Change Streams are efficient
- Typical overhead: ~1-2MB per connection

### Recommendations

- **< 100 concurrent users**: Works great
- **100-1000 users**: Consider connection pooling or scaling
- **1000+ users**: Consider dedicated real-time service (Pusher, Ably, etc.)

### Optimizations

**1. Heartbeat Interval**

Keeps connection alive. Adjust in [app/api/sse/route.ts](app/api/sse/route.ts):

```typescript
const heartbeat = setInterval(() => {
	controller.enqueue(
		encoder.encode(`data: ${JSON.stringify({ type: "heartbeat" })}\n\n`),
	);
}, 15000); // 15 seconds
```

**2. Only Watch Specific Operations**

Filter Change Stream events to reduce noise:

```typescript
const stream = Registration.watch([
	{
		$match: {
			operationType: { $in: ["insert", "update", "delete"] },
		},
	},
]);
```

**3. Client-Side Debouncing**

Prevent multiple rapid refreshes:

```typescript
let refreshTimeout: NodeJS.Timeout;

eventSource.onmessage = (event) => {
	clearTimeout(refreshTimeout);
	refreshTimeout = setTimeout(() => fetchData(), 500);
};
```

## Troubleshooting

### "Change Streams require replica set" Error

**Solution**: Your MongoDB instance isn't a replica set.

- Use MongoDB Atlas (free tier works)
- Or set up local replica set for development

### Connection keeps dropping

1. Check Vercel function timeout (`maxDuration`)
2. Verify heartbeat is working (check browser dev tools → Network)
3. Check MongoDB connection stability

### Updates not appearing

1. Check browser console for SSE errors
2. Verify Change Streams are enabled (MongoDB Atlas: automatic)
3. Confirm database operations are actually saving

## Comparison with Other Solutions

| Solution                   | Real-time       | Simple     | Scalable  | Works on Vercel |
| -------------------------- | --------------- | ---------- | --------- | --------------- |
| **MongoDB Change Streams** | ✅ Yes          | ✅ Yes     | ⚠️ Medium | ✅ Yes          |
| Polling                    | ❌ No (delayed) | ✅ Yes     | ✅ Yes    | ✅ Yes          |
| WebSocket                  | ✅ Yes          | ❌ Complex | ⚠️ Medium | ❌ No\*         |
| Pusher/Ably                | ✅ Yes          | ✅ Yes     | ✅ Yes    | ✅ Yes          |

\*WebSocket requires stateful long-running server

## Migration from Polling

The old `/api/poll` endpoint is still available if you need to fall back to polling. Simply replace EventSource with fetch intervals.

## Further Reading

- [MongoDB Change Streams](https://www.mongodb.com/docs/manual/changeStreams/)
- [Server-Sent Events (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Vercel Functions Limits](https://vercel.com/docs/functions/serverless-functions/runtimes#max-duration)

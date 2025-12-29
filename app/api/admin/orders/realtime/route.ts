import { auth } from '@/auth';
import { NextRequest } from 'next/server';
import { addRealtimeConnection } from '@/lib/utils/realtime-sync';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const send = (data: any) => {
          try {
            const message = `data: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(message));
          } catch (error) {
            console.error('Error sending SSE message:', error);
          }
        };

        send({ type: 'connected', message: 'Real-time sync connected' });

        const userId = 'admin';
        const removeConnection = addRealtimeConnection(send, userId);

        req.signal.addEventListener('abort', () => {
          removeConnection();
          try {
            controller.close();
          } catch (error) {
            console.error('Error closing SSE stream:', error);
          }
        });

        const keepAliveInterval = setInterval(() => {
          try {
            send({ type: 'ping', timestamp: new Date().toISOString() });
          } catch (error) {
            clearInterval(keepAliveInterval);
            removeConnection();
            controller.close();
          }
        }, 30000);

        req.signal.addEventListener('abort', () => {
          clearInterval(keepAliveInterval);
          removeConnection();
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('Error setting up real-time sync:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}


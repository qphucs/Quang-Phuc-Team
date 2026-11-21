import { Client } from "pg";
import { env } from "@/lib/env";
import { EVENT_CHANNEL } from "@/lib/realtime-events";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

/** Server-Sent Events stream. Each browser tab holds one stream; Postgres NOTIFY feeds it. */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  // LISTEN needs a dedicated connection, so it cannot come from the shared pool.
  const client = new Client({ connectionString: env.DB_URL });
  client.on("error", () => {
    // Connection errors close the stream; the browser reconnects automatically.
  });
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let closed = false;

  const cleanup = () => {
    if (closed) return;
    closed = true;
    clearInterval(heartbeat);
    client.end().catch(() => {});
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (chunk: string) => {
        if (!closed) controller.enqueue(encoder.encode(chunk));
      };
      client.on("notification", (msg) => {
        if (msg.channel === EVENT_CHANNEL && msg.payload) send(`data: ${msg.payload}\n\n`);
      });
      await client.connect();
      await client.query(`LISTEN ${EVENT_CHANNEL}`);
      send("retry: 3000\n\n");
      heartbeat = setInterval(() => send(": ping\n\n"), 25_000);
      request.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

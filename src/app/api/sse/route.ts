import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Create a new ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await fetch(`${URL}/api/sse`, {
            headers: {
              Authorization: "Bearer token",
              "Cache-Control": "no-cache",
            },
          });

          if (!response.ok) {
            const errorBody = await response.text();
            console.error("API error message:", errorBody);
            controller.enqueue(
              encodeSSE("error", `API responded with status ${response.status}`)
            );
            controller.close();
            return;
          }

          const reader = response.body?.getReader();
          if (!reader) {
            controller.enqueue(encodeSSE("error", "No data received from API"));
            controller.close();
            return;
          }

          // Notify client of successful connection
          controller.enqueue(encodeSSE("init", "Connecting..."));

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }

          controller.close();
          reader.releaseLock();
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(encodeSSE("error", "Stream interrupted"));
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream",
      },
      status: 200,
    });
  } catch (error) {
    console.error("Server error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}

/**
 * Helper function to format Server-Sent Events (SSE) messages
 * @param event - Event name
 * @param data - Data payload
 * @returns Encoded SSE string
 */
function encodeSSE(event: string, data: string): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${data}\n\n`);
}

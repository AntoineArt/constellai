import { streamText } from "ai";
import {
  createGatewayModel,
  getApiKeyFromHeaders,
  getModelFromRequest,
} from "@/lib/ai-config";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const apiKey = getApiKeyFromHeaders(new Headers(req.headers));

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key is required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { messages, temperature = 0.7 } = body;
    const modelId = getModelFromRequest(body);

    console.log("Chat API: model =", modelId, "messages =", messages.length);

    const model = createGatewayModel(modelId, apiKey);

    const result = streamText({
      model,
      messages,
      temperature,
    });

    // Log the streamed text
    const { textStream } = result;
    const chunks: string[] = [];

    const loggingStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of textStream) {
            chunks.push(chunk);
            controller.enqueue(new TextEncoder().encode(chunk));
          }
          console.log("Streamed full text:", chunks.join(""));
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(loggingStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

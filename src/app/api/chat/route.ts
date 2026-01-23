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

    const model = createGatewayModel(modelId, apiKey);

    const result = streamText({
      model,
      messages,
      temperature,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

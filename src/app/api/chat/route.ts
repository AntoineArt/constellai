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
    
    // Log the full body for debugging
    console.log("Chat API request body:", JSON.stringify(body, null, 2));
    
    const { messages, temperature = 0.7 } = body;
    const modelId = getModelFromRequest(body);

    // Validate that messages array exists and is not empty
    if (!messages || !Array.isArray(messages)) {
      console.error("Chat API error: messages array missing or invalid", { body });
      return new Response(
        JSON.stringify({ 
          error: "Messages array is required",
          details: "The request body must include a 'messages' array",
          receivedBody: body
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "Messages array cannot be empty"
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Chat API: model =", modelId, "messages =", messages.length);

    const model = createGatewayModel(modelId, apiKey);

    const result = streamText({
      model,
      messages,
      temperature,
    });

    // Use data stream format for useChat compatibility
    return result.toDataStreamResponse();
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

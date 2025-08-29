import { generateText } from "ai";
import { getApiKeyFromHeaders, getModelFromRequest } from "@/lib/ai-config";

export const maxDuration = 10;

export async function POST(req: Request) {
  try {
    const apiKey = getApiKeyFromHeaders(new Headers(req.headers));

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key is required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    process.env.AI_GATEWAY_API_KEY = apiKey;

    const body = await req.json();
    const model = getModelFromRequest(body);
    const { toolId, inputs } = body;

    // Create context-specific prompts for different tools
    let prompt = "";

    switch (toolId) {
      case "chat": {
        const messages = inputs.messages || [];
        const firstUserMessage =
          messages.find((m: any) => m.role === "user")?.content || "";
        prompt = `Generate a short, descriptive title (max 6 words) for this chat conversation. First user message: "${firstUserMessage.slice(0, 200)}"`;
        break;
      }

      case "regex": {
        const description = inputs.description || "";
        prompt = `Generate a short, descriptive title (max 6 words) for this regex pattern request: "${description.slice(0, 200)}"`;
        break;
      }

      case "summarizer": {
        const text = inputs.text || "";
        const summaryType = inputs.summaryType || "brief";
        prompt = `Generate a short, descriptive title (max 6 words) for this ${summaryType} summary request of: "${text.slice(0, 200)}"`;
        break;
      }

      default:
        prompt = `Generate a short, descriptive title (max 6 words) for this ${toolId} tool usage with inputs: ${JSON.stringify(inputs).slice(0, 200)}`;
    }

    const { text } = await generateText({
      model: "openai/gpt-oss-20b",
      system:
        "You are a helpful assistant that generates concise, descriptive titles. Always respond with just the title, no quotes, no explanations, maximum 6 words.",
      prompt,
    });

    // Clean up the response and ensure it's not too long
    const title = text
      .trim()
      .replace(/^["']|["']$/g, "")
      .slice(0, 50);

    return Response.json({ title });
  } catch (error) {
    console.error("Title generation API error:", error);
    // Fallback to timestamp-based title if AI generation fails
    const timestamp = new Date().toLocaleString();
    return Response.json({
      title: `Session ${timestamp.split(",")[0]}`,
      fallback: true,
    });
  }
}

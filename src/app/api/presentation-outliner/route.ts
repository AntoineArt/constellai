import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getApiKeyFromHeaders, getModelFromRequest } from "@/lib/ai-config";

export const maxDuration = 30;

const openai = createOpenAI({
  baseURL: "https://gateway.ai.cloudflare.com/v1/ACCOUNT_TAG/GATEWAY/openai",
});

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
    const { topic, audience, duration, purpose, keyMessages } = body;

    const model = getModelFromRequest(body);

    const result = streamText({
      model: openai(model),
      messages: [
        {
          role: "system",
          content: `You are a presentation strategy expert who creates comprehensive, structured presentation outlines. Your outlines should be practical, engaging, and tailored to the specific audience and purpose.

Create detailed presentation outlines that include:
- Clear structure with timing
- Engaging opening and closing
- Main points with supporting details
- Transition suggestions
- Visual aid recommendations
- Audience engagement strategies
- Speaker notes and tips

Format your response as a well-structured outline with clear sections, timing estimates, and actionable guidance.`,
        },
        {
          role: "user",
          content: `Create a comprehensive presentation outline for:

**Topic:** ${topic}
**Target Audience:** ${audience}
**Duration:** ${duration}
**Purpose:** ${purpose}
**Key Messages:** ${keyMessages}

Please provide a detailed outline with structure, timing, content suggestions, and presentation tips.`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in presentation-outliner:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate presentation outline" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
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
    const { context, audience, personality, topics, purpose } = body;

    const model = getModelFromRequest(body);

    const result = streamText({
      model: openai(model),
      messages: [
        {
          role: "system",
          content: `You are a social communication expert who helps people create engaging, natural conversation starters and small talk topics. You understand social dynamics and how to build rapport through appropriate conversation.

Generate conversation starters that are:
- Natural and contextually appropriate
- Engaging but not intrusive
- Suitable for the specific audience and setting
- Easy to expand into longer conversations
- Culturally sensitive and professional
- Organized by category or situation
- Include follow-up questions and responses

Provide a variety of options with different approaches and tones to match different personalities and comfort levels.`,
        },
        {
          role: "user",
          content: `Please generate conversation starters and small talk topics for:

**Context/Setting:** ${context}
**Audience:** ${audience}
**Your Personality Style:** ${personality}
**Preferred Topics:** ${topics}
**Purpose:** ${purpose}

Please provide a variety of conversation starters with follow-up suggestions and tips for keeping the conversation flowing.`,
        },
      ],
      temperature: 0.8,
      maxTokens: 2000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in small-talk-generator:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate conversation starters" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
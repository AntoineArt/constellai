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
    const { occasion, audience, duration, tone, keyPoints, personalStories } = body;

    const model = getModelFromRequest(body);

    const result = streamText({
      model: openai(model),
      messages: [
        {
          role: "system",
          content: `You are a professional speechwriter who crafts compelling, memorable speeches for various occasions. You understand the power of storytelling, emotional connection, and persuasive language.

Create speeches that:
- Have a strong opening that captures attention
- Include compelling stories and examples
- Use rhetorical devices effectively
- Build to meaningful conclusions
- Are appropriate for the occasion and audience
- Include stage directions and delivery notes
- Have natural flow and transitions
- Balance emotion and logic

Format your response as a complete speech with clear sections, delivery notes in brackets, and suggested pauses/emphasis.`,
        },
        {
          role: "user",
          content: `Write a speech for the following:

**Occasion:** ${occasion}
**Audience:** ${audience}
**Duration:** ${duration}
**Tone:** ${tone}
**Key Points to Cover:** ${keyPoints}
${personalStories ? `**Personal Stories/Examples:** ${personalStories}` : ""}

Please provide a complete speech with delivery notes, timing suggestions, and emphasis cues.`,
        },
      ],
      temperature: 0.8,
      maxTokens: 2500,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in speech-writer:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate speech" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
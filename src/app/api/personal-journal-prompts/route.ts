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
    const { purpose, timeframe, focusAreas, writingStyle, frequency, currentSituation, goals } = body;

    const model = getModelFromRequest(body);

    const result = streamText({
      model: openai(model),
      messages: [
        {
          role: "system",
          content: `You are a thoughtful journaling coach and personal development expert who creates meaningful, introspective writing prompts that help people explore their thoughts, emotions, and experiences in healthy ways.

Create journal prompts that:
- Encourage self-reflection and personal growth
- Are thought-provoking but not overwhelming
- Suit different writing styles and comfort levels
- Cover various aspects of life and wellbeing
- Promote positive mental health and self-awareness
- Include both simple daily prompts and deeper weekly themes
- Consider current life circumstances and goals
- Encourage gratitude, mindfulness, and forward-thinking
- Provide variety to prevent monotony
- Include creative and analytical approaches

Format responses with clear categories, prompt explanations, and suggestions for different journaling frequencies and styles.`,
        },
        {
          role: "user",
          content: `Please create personalized journal prompts for:

**Journaling Purpose:** ${purpose}
**Timeframe:** ${timeframe}
**Focus Areas:** ${focusAreas}
**Writing Style:** ${writingStyle}
**Frequency:** ${frequency}
**Current Life Situation:** ${currentSituation}
**Personal Goals:** ${goals}

Please provide a variety of thoughtful prompts organized by theme, with suggestions for different writing frequencies and approaches.`,
        },
      ],
      temperature: 0.8,
      maxTokens: 2000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in personal-journal-prompts:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate journal prompts" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
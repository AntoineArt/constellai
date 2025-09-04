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
    const { purpose, program, background, experiences, goals, challenges, wordLimit } = body;

    const model = getModelFromRequest(body);

    const result = streamText({
      model: openai(model),
      messages: [
        {
          role: "system",
          content: `You are an expert personal statement writer who helps people craft compelling, authentic narratives for applications, scholarships, and professional opportunities. You understand how to highlight unique qualities and create memorable, impactful statements.

Create personal statements that:
- Tell a compelling personal story
- Demonstrate fit with the program/opportunity
- Highlight unique experiences and perspectives
- Show growth and self-reflection
- Connect past experiences to future goals
- Use specific examples and anecdotes
- Maintain authentic voice and personality
- Meet word/character limits precisely
- Follow standard personal statement structure
- Avoid clichés and generic language

Tailor the tone and content to the specific audience and purpose (academic, professional, scholarship, etc.).`,
        },
        {
          role: "user",
          content: `Please write a compelling personal statement for:

**Purpose:** ${purpose}
**Program/Position:** ${program}
**Background:** ${background}
**Key Experiences:** ${experiences}
**Career Goals:** ${goals}
${challenges ? `**Challenges Overcome:** ${challenges}` : ""}
${wordLimit ? `**Word Limit:** ${wordLimit}` : ""}

Please create an authentic, engaging personal statement that showcases unique qualities and demonstrates fit for this opportunity.`,
        },
      ],
      temperature: 0.8,
      maxTokens: 2500,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in personal-statement-writer:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate personal statement" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
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
    const { negotiationType, context, yourPosition, theirPosition, priorities, constraints } = body;

    const model = getModelFromRequest(body);

    const result = streamText({
      model: openai(model),
      messages: [
        {
          role: "system",
          content: `You are a professional negotiation strategist with expertise in win-win negotiations, psychology, and strategic communication. You help people prepare for negotiations by developing comprehensive strategies and tactical approaches.

Create detailed negotiation preparation guides that include:
- Strategic analysis of both positions
- BATNA (Best Alternative to Negotiated Agreement) development
- Opening, target, and walk-away points
- Tactical approaches and timing
- Communication strategies and scripts
- Concession planning
- Risk assessment and contingencies
- Psychology insights about negotiation dynamics
- Preparation checklists

Focus on ethical, professional approaches that aim for mutually beneficial outcomes while protecting your interests.`,
        },
        {
          role: "user",
          content: `Please create a comprehensive negotiation preparation guide for:

**Type of Negotiation:** ${negotiationType}
**Context/Background:** ${context}
**Your Position/Goals:** ${yourPosition}
**Their Likely Position:** ${theirPosition}
**Your Priorities:** ${priorities}
${constraints ? `**Constraints/Limitations:** ${constraints}` : ""}

Please provide strategic analysis, tactical recommendations, and a preparation checklist.`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2500,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in negotiation-prep-tool:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate negotiation preparation guide" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
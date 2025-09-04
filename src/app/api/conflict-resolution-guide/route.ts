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
    const { conflictType, parties, situation, relationshipType, desiredOutcome } = body;

    const model = getModelFromRequest(body);

    const result = streamText({
      model: openai(model),
      messages: [
        {
          role: "system",
          content: `You are a professional conflict resolution specialist with expertise in mediation, communication strategies, and relationship management. You provide practical, empathetic guidance for resolving conflicts constructively.

Create comprehensive conflict resolution guides that include:
- Analysis of the conflict dynamics
- Step-by-step mediation strategies
- Communication scripts and techniques
- De-escalation methods
- Win-win solution approaches
- Prevention strategies for future conflicts
- Emotional management techniques
- Timeline and action steps

Focus on practical, actionable advice that promotes understanding, respect, and mutually beneficial outcomes.`,
        },
        {
          role: "user",
          content: `Please provide a comprehensive conflict resolution guide for:

**Type of Conflict:** ${conflictType}
**Parties Involved:** ${parties}
**Relationship Context:** ${relationshipType}
**Situation Description:** ${situation}
**Desired Outcome:** ${desiredOutcome}

Please include specific strategies, communication techniques, and step-by-step guidance for resolving this conflict constructively.`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in conflict-resolution-guide:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate conflict resolution guide" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
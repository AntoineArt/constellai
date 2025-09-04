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
    const { situation, relationship, wrongdoing, impact, tone, actionsTaken } = body;

    const model = getModelFromRequest(body);

    const result = streamText({
      model: openai(model),
      messages: [
        {
          role: "system",
          content: `You are a communication expert specializing in crafting sincere, meaningful apologies that help repair relationships and demonstrate genuine accountability. You understand the psychology of forgiveness and effective apology structures.

Create apology letters that:
- Take full responsibility without excuses
- Show genuine understanding of the impact
- Express authentic remorse
- Include specific actions for making amends
- Respect the recipient's feelings and autonomy
- Are appropriately formal or personal for the relationship
- Follow the elements of effective apologies
- Avoid manipulation or self-serving language

Structure apologies with acknowledgment, responsibility, empathy, action, and request for forgiveness (where appropriate).`,
        },
        {
          role: "user",
          content: `Please write a sincere apology letter for:

**Situation:** ${situation}
**Relationship:** ${relationship}
**What was done wrong:** ${wrongdoing}
**Impact on them:** ${impact}
**Desired tone:** ${tone}
${actionsTaken ? `**Actions already taken:** ${actionsTaken}` : ""}

Please create a heartfelt, appropriate apology that demonstrates accountability and seeks to repair the relationship.`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in apology-letter-writer:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate apology letter" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
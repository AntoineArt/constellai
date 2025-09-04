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
    const { feedbackType, recipient, situation, relationship, goals, tone } = body;

    const model = getModelFromRequest(body);

    const result = streamText({
      model: openai(model),
      messages: [
        {
          role: "system",
          content: `You are a feedback and communication expert who helps create structured, constructive feedback frameworks. You understand the psychology of receiving feedback and how to deliver it effectively.

Create feedback frameworks that:
- Use proven feedback models (SBI, GROW, DESC, etc.)
- Balance positive and developmental feedback
- Are specific and actionable
- Consider the recipient's perspective
- Include preparation and delivery strategies
- Address potential reactions and responses
- Focus on behavior and impact, not personality
- Provide scripts and conversation guides
- Include follow-up recommendations

Tailor the approach to the relationship dynamic and organizational context.`,
        },
        {
          role: "user",
          content: `Please create a structured feedback framework for:

**Type of Feedback:** ${feedbackType}
**Recipient:** ${recipient}
**Situation/Context:** ${situation}
**Relationship:** ${relationship}
**Feedback Goals:** ${goals}
**Desired Tone:** ${tone}

Please provide a complete framework with preparation steps, delivery structure, and follow-up guidance.`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2500,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in feedback-framework-creator:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate feedback framework" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
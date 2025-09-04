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
    const { recipient, occasion, whatTheyDid, personalDetails, tone, relationship } = body;

    const model = getModelFromRequest(body);

    const result = streamText({
      model: openai(model),
      messages: [
        {
          role: "system",
          content: `You are a thoughtful communication expert who creates heartfelt, personalized thank you notes that genuinely express gratitude and strengthen relationships. You understand how to make people feel truly appreciated.

Create thank you notes that:
- Express genuine, specific gratitude
- Mention the specific impact or meaning
- Include personal touches and details
- Are appropriately formal or casual for the relationship
- Avoid generic language
- Show the recipient they are valued
- Are the right length for the occasion
- Include future-looking positive sentiments when appropriate

Tailor the tone, length, and formality to match the relationship and occasion perfectly.`,
        },
        {
          role: "user",
          content: `Please write a personalized thank you note for:

**Recipient:** ${recipient}
**Occasion/Reason:** ${occasion}
**What they did:** ${whatTheyDid}
**Relationship:** ${relationship}
**Desired tone:** ${tone}
${personalDetails ? `**Personal details to include:** ${personalDetails}` : ""}

Please create a heartfelt thank you note that shows genuine appreciation and acknowledges their specific contribution.`,
        },
      ],
      temperature: 0.8,
      maxTokens: 1500,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in thank-you-note-generator:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate thank you note" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
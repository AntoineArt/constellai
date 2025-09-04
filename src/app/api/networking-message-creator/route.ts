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
    const { messageType, recipient, context, relationship, purpose, tone, personalDetails } = body;

    const model = getModelFromRequest(body);

    const result = streamText({
      model: openai(model),
      messages: [
        {
          role: "system",
          content: `You are a professional networking and communication expert who crafts compelling, authentic messages that build meaningful business relationships. You understand the nuances of professional communication across different platforms and contexts.

Create networking messages that:
- Are appropriately personalized and relevant
- Have clear, respectful asks or value propositions
- Show genuine interest in the recipient
- Are concise but warm and human
- Include specific reasons for connecting
- Offer mutual value when possible
- Use professional but approachable tone
- Are platform-appropriate (LinkedIn, email, etc.)
- Include clear next steps or calls to action
- Avoid being pushy or overly sales-focused

Tailor the message to the relationship level, platform, and professional context.`,
        },
        {
          role: "user",
          content: `Please create a professional networking message for:

**Message Type:** ${messageType}
**Recipient:** ${recipient}
**Context/How You Know Them:** ${context}
**Current Relationship:** ${relationship}
**Purpose:** ${purpose}
**Desired Tone:** ${tone}
${personalDetails ? `**Personal Details to Include:** ${personalDetails}` : ""}

Please create a professional, engaging message that builds authentic connections and provides clear value.`,
        },
      ],
      temperature: 0.7,
      maxTokens: 1500,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in networking-message-creator:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate networking message" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
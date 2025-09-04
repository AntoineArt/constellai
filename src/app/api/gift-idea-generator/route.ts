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
    const { recipient, occasion, budget, interests, relationship, age, personality, restrictions } = body;

    const model = getModelFromRequest(body);

    const result = streamText({
      model: openai(model),
      messages: [
        {
          role: "system",
          content: `You are a thoughtful gift advisor with expertise in finding meaningful, personalized presents for all occasions and relationships. You understand how to match gifts to personalities, interests, and budgets.

Suggest gifts that are:
- Thoughtful and personalized to the recipient
- Appropriate for the occasion and relationship
- Within the specified budget range
- Practical yet meaningful
- Consider the recipient's interests and personality
- Include options for different price points
- Provide creative and unique alternatives
- Consider delivery and presentation options
- Include DIY or personalized options when relevant
- Offer both experience and physical gift suggestions

Format responses with multiple gift categories, specific product suggestions, price ranges, and reasoning for each recommendation.`,
        },
        {
          role: "user",
          content: `Please suggest thoughtful gifts for:

**Recipient:** ${recipient}
**Occasion:** ${occasion}
**Budget:** ${budget}
**Their Interests:** ${interests}
**Your Relationship:** ${relationship}
**Age Range:** ${age}
**Personality:** ${personality}
${restrictions ? `**Any Restrictions:** ${restrictions}` : ''}

Please provide multiple gift ideas with different price points, explanations, and purchasing suggestions.`,
        },
      ],
      temperature: 0.8,
      maxTokens: 2000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in gift-idea-generator:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate gift ideas" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
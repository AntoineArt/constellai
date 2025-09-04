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
    const { originalRecipe, modifications, servings, dietaryNeeds, availableIngredients, skillLevel, timeConstraints } = body;

    const model = getModelFromRequest(body);

    const result = streamText({
      model: openai(model),
      messages: [
        {
          role: "system",
          content: `You are a professional chef and recipe developer with expertise in adapting recipes for different dietary needs, serving sizes, and cooking constraints. You understand ingredient substitutions, cooking techniques, and flavor balance.

Modify recipes while maintaining:
- Proper ingredient ratios and proportions
- Cooking techniques and timing adjustments
- Flavor balance and texture considerations
- Nutritional value when possible
- Food safety principles
- Realistic cooking skill requirements
- Clear, step-by-step instructions
- Ingredient substitution explanations
- Cooking tips and troubleshooting
- Storage and reheating instructions

Provide detailed explanations for all modifications and alternatives when substitutions affect taste or texture significantly.`,
        },
        {
          role: "user",
          content: `Please modify this recipe based on the following requirements:

**Original Recipe:**
${originalRecipe}

**Requested Modifications:** ${modifications}
**New Serving Size:** ${servings}
**Dietary Requirements:** ${dietaryNeeds}
**Available Ingredients:** ${availableIngredients}
**Cooking Skill Level:** ${skillLevel}
**Time Constraints:** ${timeConstraints}

Please provide the modified recipe with ingredient substitutions, adjusted cooking times, and detailed explanations for changes.`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in recipe-modifier:", error);
    return new Response(
      JSON.stringify({ error: "Failed to modify recipe" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
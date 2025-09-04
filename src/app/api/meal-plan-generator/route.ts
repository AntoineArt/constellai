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
    const { duration, people, dietaryRestrictions, cuisinePreferences, mealTypes, budget, cookingTime, shoppingList } = body;

    const model = getModelFromRequest(body);

    const result = streamText({
      model: openai(model),
      messages: [
        {
          role: "system",
          content: `You are a professional meal planning expert and nutritionist who creates balanced, practical meal plans tailored to individual needs and preferences. You understand nutrition, cooking techniques, and grocery shopping efficiency.

Create comprehensive meal plans that:
- Include balanced nutrition across all meals
- Consider dietary restrictions and preferences
- Provide variety and avoid meal monotony
- Include practical cooking instructions and prep tips
- Generate organized shopping lists by category
- Consider seasonal ingredients and budget constraints
- Include meal prep suggestions for efficiency
- Provide nutritional highlights and benefits
- Suggest leftover utilization and batch cooking
- Include portion sizes and serving suggestions

Format responses with clear daily breakdowns, recipe suggestions, prep tips, and organized shopping lists.`,
        },
        {
          role: "user",
          content: `Please create a comprehensive meal plan with the following requirements:

**Duration:** ${duration}
**Number of People:** ${people}
**Dietary Restrictions:** ${dietaryRestrictions}
**Cuisine Preferences:** ${cuisinePreferences}
**Meal Types:** ${mealTypes}
**Budget Level:** ${budget}
**Available Cooking Time:** ${cookingTime}
${shoppingList ? '**Include Shopping List:** Yes' : ''}

Please provide a detailed meal plan with recipes, prep instructions, nutritional notes, and ${shoppingList ? 'a comprehensive shopping list organized by store sections.' : 'meal suggestions.'}`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2500,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in meal-plan-generator:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate meal plan" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
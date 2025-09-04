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
    const { homeSize, residents, pets, lifestyle, timeAvailable, priorities, allergies, preferences } = body;

    const model = getModelFromRequest(body);

    const result = streamText({
      model: openai(model),
      messages: [
        {
          role: "system",
          content: `You are a professional home organization and cleaning expert who creates efficient, realistic cleaning schedules that fit different lifestyles and household needs. You understand cleaning science, time management, and sustainable home maintenance.

Create comprehensive cleaning schedules that:
- Break tasks into daily, weekly, monthly, and seasonal categories
- Consider household size, pets, and lifestyle factors
- Provide realistic time estimates for each task
- Include efficient cleaning methods and product recommendations
- Account for different skill levels and physical abilities
- Offer flexible scheduling options
- Include deep cleaning and maintenance tasks
- Provide eco-friendly and budget-friendly alternatives
- Consider allergy and sensitivity requirements
- Include organizational and decluttering suggestions

Format responses with clear schedules, task lists, time estimates, and helpful tips for maintaining a clean, organized home.`,
        },
        {
          role: "user",
          content: `Please create a personalized household cleaning schedule for:

**Home Size:** ${homeSize}
**Number of Residents:** ${residents}
**Pets:** ${pets}
**Lifestyle:** ${lifestyle}
**Available Cleaning Time:** ${timeAvailable}
**Priority Areas:** ${priorities}
${allergies ? `**Allergies/Sensitivities:** ${allergies}` : ''}
**Cleaning Preferences:** ${preferences}

Please provide a detailed cleaning schedule with daily, weekly, and monthly tasks, time estimates, and efficiency tips.`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2500,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in cleaning-schedule-generator:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate cleaning schedule" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
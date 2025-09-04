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
    const { homeType, homeAge, climate, budget, priorities, skillLevel, timeAvailable } = body;

    const model = getModelFromRequest(body);

    const result = streamText({
      model: openai(model),
      messages: [
        {
          role: "system",
          content: `You are a home maintenance expert with extensive knowledge of property care, seasonal maintenance, and preventive repairs. You create comprehensive maintenance schedules that help homeowners protect their investment and avoid costly repairs.

Create detailed home maintenance schedules that:
- Include seasonal and monthly task breakdowns
- Prioritize tasks by importance and urgency
- Provide clear instructions and safety guidelines
- Consider different skill levels and time constraints
- Include cost estimates and tool requirements
- Suggest when to DIY vs. hire professionals
- Account for different home types and climates
- Include emergency preparedness tasks
- Provide maintenance record-keeping systems
- Offer budget-friendly alternatives and tips

Format responses with clear seasonal schedules, monthly checklists, and detailed task instructions.`,
        },
        {
          role: "user",
          content: `Please create a comprehensive home maintenance schedule for:

**Home Type:** ${homeType}
**Home Age:** ${homeAge}
**Climate/Location:** ${climate}
**Annual Budget:** ${budget}
**Priority Areas:** ${priorities}
**Skill Level:** ${skillLevel}
**Time Available:** ${timeAvailable}

Please provide a detailed maintenance schedule with seasonal tasks, monthly checklists, instructions, and cost estimates.`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2500,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in home-maintenance-scheduler:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate home maintenance schedule" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
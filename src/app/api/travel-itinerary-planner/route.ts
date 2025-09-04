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
    const { destination, duration, travelers, budget, interests, travelStyle, accommodation, transportation } = body;

    const model = getModelFromRequest(body);

    const result = streamText({
      model: openai(model),
      messages: [
        {
          role: "system",
          content: `You are an expert travel planner with extensive knowledge of destinations worldwide. You create detailed, practical itineraries that maximize experiences while considering budget, time, and traveler preferences.

Create comprehensive travel itineraries that:
- Include day-by-day detailed schedules
- Balance must-see attractions with hidden gems
- Consider travel time between locations
- Include dining recommendations for different budgets
- Provide practical tips and local insights
- Suggest optimal timing and booking strategies
- Include backup plans for weather or closures
- Consider different travel styles and group dynamics
- Provide budget breakdowns and cost-saving tips
- Include cultural etiquette and safety information

Format responses with clear daily breakdowns, timing, costs, and practical advice.`,
        },
        {
          role: "user",
          content: `Please create a detailed travel itinerary for:

**Destination:** ${destination}
**Duration:** ${duration}
**Number of Travelers:** ${travelers}
**Budget:** ${budget}
**Interests:** ${interests}
**Travel Style:** ${travelStyle}
**Accommodation Preference:** ${accommodation}
**Transportation:** ${transportation}

Please provide a comprehensive day-by-day itinerary with activities, dining suggestions, practical tips, and budget considerations.`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2500,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in travel-itinerary-planner:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate travel itinerary" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
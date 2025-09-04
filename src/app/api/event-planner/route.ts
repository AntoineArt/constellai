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
    const { eventType, guests, budget, date, venue, theme, specialRequirements, timeframe } = body;

    const model = getModelFromRequest(body);

    const result = streamText({
      model: openai(model),
      messages: [
        {
          role: "system",
          content: `You are a professional event planner with extensive experience organizing successful events of all types and sizes. You create comprehensive planning checklists and timelines that ensure memorable, well-executed events.

Create detailed event planning guides that:
- Include comprehensive checklists organized by timeline
- Provide budget breakdowns and cost-saving tips
- Consider all aspects from invitations to cleanup
- Account for different event types and guest counts
- Include vendor recommendations and booking strategies
- Provide contingency planning for common issues
- Consider dietary restrictions and accessibility needs
- Include decoration and theme implementation ideas
- Provide day-of coordination schedules
- Include post-event follow-up suggestions

Format responses with clear timelines, checklists, budget estimates, and practical tips for successful event execution.`,
        },
        {
          role: "user",
          content: `Please create a comprehensive event planning guide for:

**Event Type:** ${eventType}
**Number of Guests:** ${guests}
**Budget:** ${budget}
**Date:** ${date}
**Venue Type:** ${venue}
**Theme/Style:** ${theme}
**Special Requirements:** ${specialRequirements}
**Planning Timeframe:** ${timeframe}

Please provide a detailed planning checklist with timeline, budget breakdown, vendor suggestions, and day-of coordination guide.`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2500,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in event-planner:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate event plan" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
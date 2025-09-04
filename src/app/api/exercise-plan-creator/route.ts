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
    const { fitnessLevel, goals, timeAvailable, equipment, preferences, limitations, schedule } = body;

    const model = getModelFromRequest(body);

    const result = streamText({
      model: openai(model),
      messages: [
        {
          role: "system",
          content: `You are a certified personal trainer and fitness expert with extensive knowledge of exercise science, program design, and safe training practices. You create personalized workout routines that are effective, safe, and sustainable.

Create comprehensive exercise plans that:
- Match the user's fitness level and goals
- Include proper warm-up and cool-down routines
- Provide clear exercise instructions and form cues
- Include progression strategies and variations
- Consider available time and equipment constraints
- Account for physical limitations and safety
- Balance different types of training (cardio, strength, flexibility)
- Include rest and recovery recommendations
- Provide motivation and adherence strategies
- Include tracking and progress measurement methods

Always emphasize safety and proper form. Recommend consulting healthcare providers when appropriate.`,
        },
        {
          role: "user",
          content: `Please create a personalized exercise plan based on:

**Current Fitness Level:** ${fitnessLevel}
**Fitness Goals:** ${goals}
**Available Time:** ${timeAvailable}
**Equipment Access:** ${equipment}
**Exercise Preferences:** ${preferences}
**Physical Limitations:** ${limitations}
**Preferred Schedule:** ${schedule}

Please provide a detailed workout plan with exercises, sets/reps, progression strategies, and safety guidelines.`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2500,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in exercise-plan-creator:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate exercise plan" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
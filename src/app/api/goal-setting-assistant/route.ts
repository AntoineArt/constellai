import { streamText } from "ai";
import { getApiKeyFromHeaders, getModelFromRequest } from "@/lib/ai-config";

export const maxDuration = 30;

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
    const model = getModelFromRequest(body);
    const {
      goalArea,
      currentSituation,
      desiredOutcome,
      timeframe,
      includeActionPlan,
      includeMetrics,
    } = body;

    const prompt = `You are an expert goal-setting coach and productivity specialist. Create SMART goals based on:

Goal Area: ${goalArea || "Area of life or work"}
Current Situation: ${currentSituation || "Current state"}
Desired Outcome: ${desiredOutcome || "What you want to achieve"}
Timeframe: ${timeframe || "Goal timeframe"}
Include Action Plan: ${includeActionPlan ? "Yes" : "No"}
Include Metrics: ${includeMetrics ? "Yes" : "No"}

Create comprehensive SMART goals including:

## Goal Setting Analysis

### Current Situation Assessment
[Analysis of where you are now]

### SMART Goals Framework

#### Primary Goal
**Specific**: [Clear, specific goal statement]
**Measurable**: [How progress will be measured]
**Achievable**: [Why this goal is realistic]
**Relevant**: [How this aligns with your values/purpose]
**Time-bound**: [Specific timeframe for completion]

#### Supporting Goals
[Additional goals that support the primary goal]

### Action Plan
[If requested, detailed step-by-step action plan]

### Key Milestones
[Important checkpoints along the way]

### Success Metrics
[If requested, specific metrics to track progress]

### Potential Obstacles
[Challenges you might face and how to overcome them]

### Resources Needed
[What you'll need to achieve this goal]

### Accountability Plan
[How you'll stay on track and measure progress]

### Motivation Strategies
[Ways to maintain motivation throughout the journey]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert goal-setting coach who helps people create clear, achievable SMART goals with actionable plans. Focus on making goals specific, measurable, and realistic while providing practical strategies for success.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Goal Setting Assistant error:", error);
    return new Response(JSON.stringify({ error: "Failed to create goals" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

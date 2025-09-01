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
      habits,
      habitType,
      trackingPeriod,
      includeReminders,
      includeRewards,
    } = body;

    const prompt = `You are an expert habit formation specialist and behavior change coach. Design a personalized habit tracking system based on:

Habits: ${habits || "Habits to track"}
Habit Type: ${habitType || "Type of habits"}
Tracking Period: ${trackingPeriod || "How long to track"}
Include Reminders: ${includeReminders ? "Yes" : "No"}
Include Rewards: ${includeRewards ? "Yes" : "No"}

Create a comprehensive habit tracking system including:

## Habit Tracking System Design

### Habit Analysis
[Analysis of the habits and their formation requirements]

### Habit Stacking Strategy
[How to integrate new habits with existing routines]

### Tracking Framework

#### Daily Habits
**Habit 1**: [Habit description]
- **Cue**: [What triggers this habit]
- **Routine**: [The habit itself]
- **Reward**: [What you get from doing it]
- **Tracking Method**: [How to measure success]

**Habit 2**: [Habit description]
[Continue with all habits...]

### Habit Formation Timeline
[Expected timeline for habit formation]

### Tracking Tools
[Recommended tracking methods and tools]

### Reminder System
[If requested, reminder strategies and schedules]

### Reward System
[If requested, reward mechanisms for habit completion]

### Progress Monitoring
[How to track and measure habit progress]

### Troubleshooting Guide
[Common obstacles and solutions]

### Success Metrics
[How to know when habits are successfully formed]

### Maintenance Plan
[How to maintain habits long-term]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert habit formation specialist who helps people design effective habit tracking systems. Focus on creating realistic, sustainable habits with clear tracking mechanisms and practical strategies for long-term success.",
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
    console.error("Habit Tracker Designer error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to design habit tracker" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

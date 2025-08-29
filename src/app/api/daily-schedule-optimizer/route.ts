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
    const { currentSchedule, priorities, energyLevels, workHours, includeBreaks, includeBufferTime } = body;

    const prompt = `You are an expert productivity consultant and time management specialist. Optimize a daily schedule based on:

Current Schedule: ${currentSchedule || "Current daily schedule"}
Priorities: ${priorities || "Daily priorities and goals"}
Energy Levels: ${energyLevels || "Energy patterns throughout the day"}
Work Hours: ${workHours || "Available work hours"}
Include Breaks: ${includeBreaks ? "Yes" : "No"}
Include Buffer Time: ${includeBufferTime ? "Yes" : "No"}

Create an optimized daily schedule including:

## Daily Schedule Optimization

### Schedule Analysis
[Analysis of current schedule and optimization opportunities]

### Energy-Based Scheduling
[How to align tasks with natural energy patterns]

### Optimized Daily Schedule

#### Morning (High Energy Period)
**6:00 AM - 9:00 AM**
- [High-priority, complex tasks]
- [Tasks requiring focus and creativity]

#### Mid-Morning (Sustained Energy)
**9:00 AM - 12:00 PM**
- [Medium-priority tasks]
- [Collaborative work]

#### Afternoon (Lower Energy)
**12:00 PM - 3:00 PM**
- [Routine tasks]
- [Administrative work]

#### Late Afternoon (Energy Recovery)
**3:00 PM - 6:00 PM**
- [Planning and review]
- [Light tasks]

### Break Schedule
[If requested, strategic break placement]

### Buffer Time Allocation
[If requested, buffer time for unexpected tasks]

### Priority Integration
[How priorities are reflected in the schedule]

### Productivity Tips
[Specific strategies for each time block]

### Schedule Flexibility
[How to adapt the schedule when needed]

### Success Metrics
[How to measure schedule effectiveness]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content: "You are an expert productivity consultant who creates optimized daily schedules that maximize productivity and energy management. Focus on aligning tasks with natural energy patterns, incorporating strategic breaks, and creating realistic, flexible schedules.",
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
    console.error("Daily Schedule Optimizer error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to optimize schedule" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

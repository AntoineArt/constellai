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
    const { tasks, priorityMethod, context, includeDeadlines, includeEffort } = body;

    const prompt = `You are an expert productivity consultant and task management specialist. Prioritize and organize tasks based on:

Tasks: ${tasks || "List of tasks to prioritize"}
Priority Method: ${priorityMethod || "Priority method"}
Context: ${context || "Work context or goals"}
Include Deadlines: ${includeDeadlines ? "Yes" : "No"}
Include Effort: ${includeEffort ? "Yes" : "No"}

Create a prioritized task list including:

## Task Prioritization Analysis

### Priority Framework
[Explanation of the prioritization method used]

### High Priority Tasks (Do First)
**Task 1**: [Task description]
- **Priority Level**: [High/Medium/Low]
- **Reason**: [Why this is high priority]
- **Deadline**: [If applicable]
- **Effort**: [Estimated effort if requested]

**Task 2**: [Task description]
- **Priority Level**: [High/Medium/Low]
- **Reason**: [Why this is high priority]
- **Deadline**: [If applicable]
- **Effort**: [Estimated effort if requested]

### Medium Priority Tasks (Schedule)
[Tasks that should be scheduled for later]

### Low Priority Tasks (Delegate or Eliminate)
[Tasks that can be delegated or eliminated]

### Task Organization Recommendations
[Suggestions for grouping or organizing tasks]

### Time Management Tips
[Recommendations for efficient task execution]

### Next Steps
[Immediate actions to take based on this prioritization]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content: "You are an expert productivity consultant who helps people organize and prioritize tasks effectively. Focus on using proven prioritization frameworks, considering context and goals, and providing actionable recommendations for task management.",
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
    console.error("Task Prioritizer error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to prioritize tasks" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

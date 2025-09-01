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
      workflowDescription,
      workflowType,
      stakeholders,
      includeAutomation,
      includeMetrics,
    } = body;

    const prompt = `You are an expert workflow designer and business process consultant. Design an efficient workflow based on:

Workflow Description: ${workflowDescription || "Workflow to design"}
Workflow Type: ${workflowType || "Type of workflow"}
Stakeholders: ${stakeholders || "People involved"}
Include Automation: ${includeAutomation ? "Yes" : "No"}
Include Metrics: ${includeMetrics ? "Yes" : "No"}

Create a comprehensive workflow design including:

## Workflow Design

### Workflow Overview
**Workflow Name**: [Workflow name]
**Purpose**: [Why this workflow exists]
**Type**: ${workflowType}
**Stakeholders**: ${stakeholders}

### Current State Analysis
[Analysis of current process and pain points]

### Workflow Design

#### Phase 1: [Phase Name]
**Trigger**: [What starts this phase]
**Activities**:
- [Activity 1]
- [Activity 2]
- [Activity 3]

**Roles**: [Who does what]
**Deliverables**: [What is produced]

#### Phase 2: [Phase Name]
[Continue with all phases...]

### Workflow Diagram Description
[Textual description of the workflow flow]

### Automation Opportunities
[If requested, areas where automation could be implemented]

### Performance Metrics
[If requested, KPIs and success measures]

### Roles and Responsibilities
[Clear definition of who does what]

### Decision Points
[Where decisions need to be made in the workflow]

### Exception Handling
[How to handle exceptions and deviations]

### Technology Requirements
[Tools and systems needed]

### Implementation Plan
[How to implement this workflow]

### Continuous Improvement
[How to monitor and improve the workflow]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert workflow designer who creates efficient, well-structured workflows that optimize business processes. Focus on creating clear process flows, defining roles and responsibilities, and identifying opportunities for improvement and automation.",
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
    console.error("Workflow Designer error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to design workflow" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

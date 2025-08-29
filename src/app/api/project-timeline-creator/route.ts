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
    const { projectDescription, projectScope, teamSize, startDate, includeMilestones, includeDependencies } = body;

    const prompt = `You are an expert project manager and timeline specialist. Create a comprehensive project timeline based on:

Project Description: ${projectDescription || "Project description"}
Project Scope: ${projectScope || "Project scope and deliverables"}
Team Size: ${teamSize || "Number of team members"}
Start Date: ${startDate || "Project start date"}
Include Milestones: ${includeMilestones ? "Yes" : "No"}
Include Dependencies: ${includeDependencies ? "Yes" : "No"}

Create a detailed project timeline including:

## Project Timeline

### Project Overview
**Project Name**: [Project name]
**Start Date**: ${startDate}
**Team Size**: ${teamSize}
**Scope**: ${projectScope}

### Project Phases

#### Phase 1: [Phase Name] (Week 1-2)
**Duration**: [Time period]
**Key Activities**:
- [Activity 1]
- [Activity 2]
- [Activity 3]

**Deliverables**:
- [Deliverable 1]
- [Deliverable 2]

**Team Members**: [Assigned team members]

#### Phase 2: [Phase Name] (Week 3-4)
[Continue with all phases...]

### Key Milestones
[If requested, list major project milestones with dates]

### Task Dependencies
[If requested, show task dependencies and critical path]

### Resource Allocation
[Team member assignments and responsibilities]

### Risk Management
[Potential risks and mitigation strategies]

### Communication Plan
[Regular check-ins and reporting schedule]

### Success Metrics
[How project success will be measured]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content: "You are an expert project manager who creates comprehensive project timelines that are realistic, well-structured, and actionable. Focus on breaking down projects into manageable phases, identifying dependencies, and providing clear deliverables and milestones.",
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
    console.error("Project Timeline Creator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create project timeline" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

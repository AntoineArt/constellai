import { streamText } from "ai";
import { getApiKeyFromHeaders } from "@/lib/ai-config";

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

    // Set the API key as environment variable for this request
    process.env.AI_GATEWAY_API_KEY = apiKey;

    const { organization, projectTitle, projectDescription, fundingAmount, grantType, targetAudience, timeline, includeBudget, includeEvaluation } = await req.json();

    const prompt = `You are an expert grant writer and funding specialist. Create a comprehensive grant proposal based on the following information:

Organization: ${organization || "Organization name"}
Project Title: ${projectTitle || "Project title"}
Project Description: ${projectDescription || "Project description"}
Funding Amount: ${fundingAmount || "Not specified"}
Grant Type: ${grantType || "General grant"}
Target Audience: ${targetAudience || "General audience"}
Timeline: ${timeline || "Not specified"}
Include Budget: ${includeBudget ? "Yes" : "No"}
Include Evaluation Plan: ${includeEvaluation ? "Yes" : "No"}

Please create a professional grant proposal that includes:
1. Executive Summary
2. Organization Background and Capacity
3. Problem Statement and Need
4. Project Goals and Objectives
5. Methodology and Implementation Plan
6. Timeline and Milestones
7. Budget Breakdown (if requested)
8. Evaluation and Impact Measurement (if requested)
9. Sustainability Plan
10. Appendices and Supporting Materials

Format your response as:
## Grant Proposal: [Project Title]

### Executive Summary
[concise overview of the proposal]

### Organization Background
[organization's mission, history, and capacity]

### Problem Statement
[clear articulation of the problem being addressed]

### Project Goals and Objectives
[specific, measurable goals and objectives]

### Methodology
[detailed implementation approach]

### Timeline
[project milestones and timeline]

### Budget
[detailed budget breakdown if requested]

### Evaluation Plan
[impact measurement and evaluation strategy if requested]

### Sustainability
[long-term sustainability plan]

### Supporting Materials
[additional documentation and appendices]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert grant writer with extensive experience in securing funding for nonprofit organizations, research projects, and community initiatives. Focus on creating compelling, well-structured proposals that clearly articulate the need, solution, and impact.",
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
    console.error("Grant Proposal Writer error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate grant proposal" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

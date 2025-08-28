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

    process.env.AI_GATEWAY_API_KEY = apiKey;

    const { researchTopic, objectives, methodology, timeline, includeDetailedMethodology, includeBudget } = await req.json();

    const prompt = `You are an expert research proposal writer. Create a research proposal based on:

Research Topic: ${researchTopic || "Research topic"}
Objectives: ${objectives || "Research objectives"}
Methodology: ${methodology || "Research methodology"}
Timeline: ${timeline || "Research timeline"}
Include Detailed Methodology: ${includeDetailedMethodology ? "Yes" : "No"}
Include Budget: ${includeBudget ? "Yes" : "No"}

Create a comprehensive research proposal including:

## Research Proposal

### Executive Summary
**Research Topic**: [Clear statement of research topic]
**Problem Statement**: [Research problem being addressed]
**Objectives**: [Main research objectives]
**Expected Outcomes**: [Anticipated results and impact]

### Introduction and Background
**Research Context**: [Background and significance]
**Literature Review**: [Brief review of relevant literature]
**Research Gap**: [Gap this research addresses]
**Research Questions**: [Specific research questions]

### Methodology
**Research Design**: [Overall research approach]
**Data Collection**: [Methods for gathering data]
**Data Analysis**: [Analysis techniques]
**Sample and Population**: [Study participants]

### Timeline and Milestones
**Project Timeline**: [Research schedule]
**Key Milestones**: [Important checkpoints]
**Deliverables**: [Expected outputs]

### Budget and Resources
[Detailed budget if requested]

### Expected Outcomes
**Research Contributions**: [How this research adds value]
**Practical Applications**: [Real-world applications]
**Future Research**: [Follow-up research directions]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert research proposal writer who creates comprehensive, well-structured research proposals. Focus on providing clear methodology, realistic timelines, and compelling justifications for research projects.",
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
    console.error("Research Proposal Writer error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate research proposal" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

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
    const { topic, gradeLevel, subject, learningLevel, includeAssessment, includeActivities } = body;

    const prompt = `You are an expert educational content developer. Generate clear learning objectives based on:

Topic: ${topic || "Learning topic"}
Grade Level: ${gradeLevel || "Grade level"}
Subject: ${subject || "Subject area"}
Learning Level: ${learningLevel || "Learning level"}
Include Assessment: ${includeAssessment ? "Yes" : "No"}
Include Activities: ${includeActivities ? "Yes" : "No"}

Create comprehensive learning objectives including:

## Learning Objectives: ${topic}

### Course/Unit Overview
[Brief description of what students will learn]

### Learning Objectives

#### Knowledge Objectives
[What students will know]
- [Objective 1]
- [Objective 2]
- [Objective 3]

#### Skills Objectives
[What students will be able to do]
- [Objective 1]
- [Objective 2]
- [Objective 3]

#### Understanding Objectives
[What students will understand]
- [Objective 1]
- [Objective 2]
- [Objective 3]

### Bloom's Taxonomy Alignment
[How objectives align with cognitive levels]

### Assessment Methods
[How to measure achievement of objectives if requested]

### Learning Activities
[Activities to achieve objectives if requested]

### Success Criteria
[Clear indicators of successful learning]

### Prerequisites
[What students should know before starting]

### Extension Objectives
[Advanced learning opportunities]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content: "You are an expert educational content developer who creates clear, measurable learning objectives that align with educational standards and promote effective learning. Focus on using action verbs, creating specific and measurable outcomes, and ensuring objectives are appropriate for the grade level.",
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
    console.error("Learning Objective Writer error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to write learning objectives" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

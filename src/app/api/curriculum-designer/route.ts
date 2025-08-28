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

    const { subject, gradeLevel, duration, learningObjectives, includeAssessments, includeResources } = await req.json();

    const prompt = `You are an expert curriculum designer. Create a comprehensive curriculum outline based on:

Subject: ${subject || "Subject area"}
Grade Level: ${gradeLevel || "Grade level"}
Duration: ${duration || "Course duration"}
Learning Objectives: ${learningObjectives || "Learning objectives"}
Include Assessments: ${includeAssessments ? "Yes" : "No"}
Include Resources: ${includeResources ? "Yes" : "No"}

Create a detailed curriculum including:

## Curriculum: ${subject}

### Course Overview
[Brief description of the course and its goals]

### Learning Objectives
[Clear, measurable learning objectives]

### Standards Alignment
[Relevant educational standards]

### Course Structure

#### Unit 1: [Unit Title]
**Duration**: [Time period]
**Learning Objectives**:
- [Objective 1]
- [Objective 2]
- [Objective 3]

**Key Concepts**:
- [Concept 1]
- [Concept 2]
- [Concept 3]

**Activities**:
- [Activity 1]
- [Activity 2]
- [Activity 3]

**Assessment**:
- [Assessment method]

#### Unit 2: [Unit Title]
[Continue with all units...]

### Assessment Strategy
[Overall assessment approach if requested]

### Resources and Materials
[Required and recommended resources if requested]

### Timeline
[Detailed course timeline]

### Differentiation Strategies
[Approaches for diverse learners]

### Technology Integration
[Technology tools and platforms]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert curriculum designer who creates comprehensive, standards-aligned curriculum outlines that promote deep learning and skill development. Focus on creating logical progressions, clear learning objectives, and appropriate assessments.",
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
    console.error("Curriculum Designer error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to design curriculum" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

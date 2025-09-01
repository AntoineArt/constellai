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
      topic,
      gradeLevel,
      duration,
      learningObjectives,
      includeActivities,
      includeAssessment,
    } = body;

    const prompt = `You are an expert curriculum developer. Create a comprehensive lesson plan based on:

Topic: ${topic || "Lesson topic"}
Grade Level: ${gradeLevel || "Grade level"}
Duration: ${duration || "Lesson duration"}
Learning Objectives: ${learningObjectives || "Learning objectives"}
Include Activities: ${includeActivities ? "Yes" : "No"}
Include Assessment: ${includeAssessment ? "Yes" : "No"}

Create a detailed lesson plan including:

## Lesson Plan: ${topic}

### Lesson Information
**Topic**: ${topic}
**Grade Level**: ${gradeLevel}
**Duration**: ${duration}
**Date**: [Date]

### Learning Objectives
[Clear, measurable learning objectives]

### Standards Alignment
[Relevant educational standards]

### Materials Needed
[List of required materials and resources]

### Lesson Structure

#### 1. Introduction (5-10 minutes)
[Engaging opening activity or hook]

#### 2. Direct Instruction (15-20 minutes)
[Main content delivery]

#### 3. Guided Practice (10-15 minutes)
[Structured practice activities]

#### 4. Independent Practice (10-15 minutes)
[Individual or group work]

#### 5. Closure (5 minutes)
[Review and wrap-up]

### Activities
[Detailed activity descriptions if requested]

### Assessment
[Assessment methods and criteria if requested]

### Differentiation
[Strategies for different learning needs]

### Homework/Extension
[Additional activities or assignments]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert curriculum developer who creates engaging, standards-aligned lesson plans that promote active learning and student engagement. Focus on creating clear, structured plans that include appropriate activities, assessments, and differentiation strategies.",
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
    console.error("Lesson Plan Creator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create lesson plan" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

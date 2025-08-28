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

    const { assignment, gradeLevel, subject, rubricType, includeCriteria, includeScoring } = await req.json();

    const prompt = `You are an expert assessment specialist. Create a comprehensive grading rubric based on:

Assignment: ${assignment || "Assignment description"}
Grade Level: ${gradeLevel || "Grade level"}
Subject: ${subject || "Subject area"}
Rubric Type: ${rubricType || "Analytic rubric"}
Include Criteria: ${includeCriteria ? "Yes" : "No"}
Include Scoring: ${includeScoring ? "Yes" : "No"}

Create a detailed assessment rubric including:

## Assessment Rubric: ${assignment}

### Assignment Overview
[Brief description of the assignment and expectations]

### Learning Objectives
[What students should demonstrate]

### Rubric Criteria

#### Criterion 1: [Criterion Name]
**Excellent (4 points)**:
- [Description of excellent performance]

**Good (3 points)**:
- [Description of good performance]

**Satisfactory (2 points)**:
- [Description of satisfactory performance]

**Needs Improvement (1 point)**:
- [Description of needs improvement]

#### Criterion 2: [Criterion Name]
[Continue with all criteria...]

### Scoring Guide
[Overall scoring system if requested]

### Assessment Tips
[Guidance for consistent grading]

### Student Self-Assessment
[Self-assessment questions for students]

### Feedback Templates
[Sample feedback comments for different levels]

### Modifications
[Suggestions for different learning needs]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert assessment specialist who creates fair, comprehensive grading rubrics that provide clear expectations and consistent evaluation criteria. Focus on creating specific, measurable criteria that align with learning objectives and provide meaningful feedback.",
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
    console.error("Assessment Rubric Creator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create assessment rubric" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

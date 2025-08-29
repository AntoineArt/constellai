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
    const { courseTitle, subject, gradeLevel, duration, learningObjectives, includeSchedule, includePolicies } = body;

    const prompt = `You are an expert course designer. Generate a comprehensive course syllabus based on:

Course Title: ${courseTitle || "Course title"}
Subject: ${subject || "Subject area"}
Grade Level: ${gradeLevel || "Grade level"}
Duration: ${duration || "Course duration"}
Learning Objectives: ${learningObjectives || "Learning objectives"}
Include Schedule: ${includeSchedule ? "Yes" : "No"}
Include Policies: ${includePolicies ? "Yes" : "No"}

Create a detailed course syllabus including:

## Course Syllabus: ${courseTitle}

### Course Information
**Course Title**: ${courseTitle}
**Subject**: ${subject}
**Grade Level**: ${gradeLevel}
**Duration**: ${duration}
**Instructor**: [Instructor name]
**Contact**: [Contact information]

### Course Description
[Brief overview of the course content and goals]

### Learning Objectives
[Clear, measurable learning objectives]

### Course Requirements
[Prerequisites, materials, and expectations]

### Course Schedule
[Weekly or daily schedule if requested]

### Assessment and Grading
**Grading Scale**:
- A: 90-100%
- B: 80-89%
- C: 70-79%
- D: 60-69%
- F: Below 60%

**Assessment Methods**:
- [Assessment type 1]: [Percentage]
- [Assessment type 2]: [Percentage]
- [Assessment type 3]: [Percentage]

### Course Policies
[Attendance, late work, academic integrity if requested]

### Required Materials
[Textbooks, supplies, and resources]

### Course Calendar
[Important dates and deadlines]

### Communication
[How to contact instructor and office hours]

### Accommodations
[Information about accommodations and support services]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content: "You are an expert course designer who creates comprehensive, professional course syllabi that provide clear expectations and structure for effective learning. Focus on creating well-organized documents that include all necessary information for students and align with educational standards.",
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
    console.error("Syllabus Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate syllabus" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

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
      notes,
      subject,
      studyLevel,
      includePracticeQuestions,
      includeSummary,
    } = body;

    const prompt = `You are an expert educational content organizer. Create a comprehensive study guide based on:

Notes: ${notes || "Study notes"}
Subject: ${subject || "Subject area"}
Study Level: ${studyLevel || "Study level"}
Include Practice Questions: ${includePracticeQuestions ? "Yes" : "No"}
Include Summary: ${includeSummary ? "Yes" : "No"}

Create a detailed study guide including:

## Study Guide: ${subject}

### Overview
[Brief overview of the subject and key concepts]

### Key Concepts
[Main concepts organized by topic]

### Detailed Explanations
[In-depth explanations of important topics]

### Important Definitions
[Key terms and their definitions]

### Formulas and Equations
[If applicable, important formulas and equations]

### Study Tips
[Effective study strategies for this subject]

### Practice Questions
[Sample questions to test understanding if requested]

### Summary
[Concise summary of main points if requested]

### Review Checklist
[Checklist of topics to review before exams]

### Additional Resources
[Suggested readings and resources for further study]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert educational content organizer who creates comprehensive, well-structured study guides that help students understand and retain information effectively. Focus on organizing content logically, highlighting key concepts, and providing clear explanations.",
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
    console.error("Study Guide Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate study guide" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

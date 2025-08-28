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

    const { content, subject, gradeLevel, questionTypes, numberOfQuestions, includeAnswers } = await req.json();

    const prompt = `You are an expert educational content creator. Generate a comprehensive quiz based on:

Content: ${content || "Educational content"}
Subject: ${subject || "Subject area"}
Grade Level: ${gradeLevel || "Grade level"}
Question Types: ${questionTypes || "Multiple choice, true/false, short answer"}
Number of Questions: ${numberOfQuestions || "10"}
Include Answers: ${includeAnswers ? "Yes" : "No"}

Create an educational quiz including:

## Quiz: ${subject}

### Instructions
[Clear instructions for students taking the quiz]

### Questions

**Question 1:**
[Question text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]

**Question 2:**
[Question text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]

[Continue with all questions...]

### Answer Key
[If requested, provide correct answers with explanations]

### Learning Objectives
[What students should learn from this quiz]

### Difficulty Level
[Assessment of quiz difficulty]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educational content creator who creates engaging, age-appropriate quizzes that effectively test knowledge and promote learning. Focus on creating clear, well-structured questions that align with educational standards and learning objectives.",
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
    console.error("Quiz Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate quiz" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

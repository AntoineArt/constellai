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

    const { content, subject, cardType, numberOfCards, includeExamples } = await req.json();

    const prompt = `You are an expert educational content creator. Generate study flashcards based on:

Content: ${content || "Study content"}
Subject: ${subject || "Subject area"}
Card Type: ${cardType || "Question-Answer"}
Number of Cards: ${numberOfCards || "20"}
Include Examples: ${includeExamples ? "Yes" : "No"}

Create comprehensive study flashcards including:

## Flashcards: ${subject}

### Study Tips
[Effective study strategies for using these flashcards]

### Flashcard Set

**Card 1:**
**Front**: [Question or concept]
**Back**: [Answer or definition]
**Example**: [If requested, provide an example]

**Card 2:**
**Front**: [Question or concept]
**Back**: [Answer or definition]
**Example**: [If requested, provide an example]

[Continue with all cards...]

### Review Schedule
[Suggested study schedule for optimal retention]

### Difficulty Levels
[Mark cards by difficulty: Easy, Medium, Hard]

### Key Concepts Summary
[Main concepts covered in this flashcard set]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educational content creator who creates effective study flashcards that promote active recall and long-term retention. Focus on creating clear, concise cards that cover key concepts and provide meaningful examples when appropriate.",
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
    console.error("Flashcard Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate flashcards" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

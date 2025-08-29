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
    const { paperContent, abstractType, wordLimit, includeKeywords } = body;

    const prompt = `You are an expert academic abstract writer. Generate an abstract based on:

Paper Content: ${paperContent || "Paper content"}
Abstract Type: ${abstractType || "Abstract type"}
Word Limit: ${wordLimit || "Word limit"}
Include Keywords: ${includeKeywords ? "Yes" : "No"}

Create a comprehensive abstract including:

## Abstract

### Main Abstract
[Concise summary of the research]

### Keywords
[Relevant keywords if requested]

### Abstract Components
**Background**: [Research context and problem]
**Methods**: [Research methodology]
**Results**: [Key findings]
**Conclusions**: [Main conclusions and implications]

### Abstract Guidelines
**Structure**: [Proper abstract structure]
**Length**: [Word count and formatting]
**Style**: [Academic writing style tips]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content: "You are an expert academic abstract writer who creates concise, well-structured abstracts that accurately summarize research papers. Focus on providing clear summaries, proper structure, and appropriate academic tone.",
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
    console.error("Abstract Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate abstract" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

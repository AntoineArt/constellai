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

    // Set the API key as environment variable for this request
    process.env.AI_GATEWAY_API_KEY = apiKey;

    const body = await req.json();
    const model = getModelFromRequest(body);
    const { errorMessage, language, context, includeCodeExamples } = body;

    const prompt = `You are an expert error message decoder and debugging specialist. Analyze the following error message and provide a comprehensive explanation and solution:

Error Message:
\`\`\`
${errorMessage}
\`\`\`

Programming Language: ${language || "Unknown"}
Context: ${context || "General application"}
Include Code Examples: ${includeCodeExamples ? "Yes" : "No"}

Please provide:
1. Clear explanation of what the error means
2. Root cause analysis
3. Step-by-step solution
4. Prevention strategies
5. Code examples (if requested)
6. Common variations of this error
7. Debugging tips

Format your response as:
## Error Analysis
[clear explanation of what the error means]

## Root Cause
[detailed analysis of why this error occurs]

## Solution Steps
[step-by-step instructions to fix the error]

## Code Examples
[working code examples and fixes]

## Prevention
[how to avoid this error in the future]

## Common Variations
[similar errors and their solutions]

## Debugging Tips
[additional debugging strategies and tools]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert software engineer who specializes in debugging and error resolution. Provide clear, actionable solutions with practical code examples and prevention strategies.",
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
    console.error("Error Decoder error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to decode error message" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

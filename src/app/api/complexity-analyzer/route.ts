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

    // Set the API key as environment variable for this request
    process.env.AI_GATEWAY_API_KEY = apiKey;

    const { code, language, includeRefactoring, includeMetrics } = await req.json();

    const prompt = `You are an expert code complexity analyzer. Analyze the following code and provide insights on complexity, maintainability, and potential improvements:

Code:
\`\`\`${language || "javascript"}
${code}
\`\`\`

Include Metrics: ${includeMetrics ? "Yes" : "No"}
Include Refactoring Suggestions: ${includeRefactoring ? "Yes" : "No"}

Please provide:
1. Complexity analysis (cyclomatic complexity, cognitive complexity)
2. Code quality assessment
3. Maintainability score and reasoning
4. Performance considerations
5. Security concerns (if any)
6. Refactoring suggestions (if requested)
7. Best practices recommendations

Format your response as:
## Complexity Analysis
[detailed complexity assessment]

## Code Quality Assessment
[quality metrics and scores]

## Maintainability Analysis
[maintainability factors and recommendations]

## Performance Considerations
[performance implications and optimizations]

## Security Review
[security concerns and recommendations]

## Refactoring Suggestions
[concrete refactoring recommendations with examples]

## Best Practices
[best practices and coding standards recommendations]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert software engineer who specializes in code quality, complexity analysis, and refactoring. Provide actionable insights and concrete suggestions for improving code maintainability and performance.",
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
    console.error("Complexity Analyzer error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to analyze code complexity" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

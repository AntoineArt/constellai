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
    const { code, language, context, includeBenchmarks, includeProfiling } = body;

    const prompt = `You are an expert performance optimization specialist. Analyze the following code and provide comprehensive performance improvement suggestions:

Code:
\`\`\`${language || "javascript"}
${code}
\`\`\`

Context: ${context || "General application"}
Include Benchmarks: ${includeBenchmarks ? "Yes" : "No"}
Include Profiling: ${includeProfiling ? "Yes" : "No"}

Please provide:
1. Performance bottleneck identification
2. Algorithmic complexity analysis
3. Memory usage optimization suggestions
4. CPU optimization recommendations
5. I/O performance improvements
6. Caching strategies
7. Code refactoring suggestions
8. Benchmarking recommendations (if requested)
9. Profiling guidance (if requested)

Format your response as:
## Performance Analysis
[overall performance assessment]

## Identified Bottlenecks
[specific performance issues found]

## Algorithmic Optimizations
[complexity improvements and algorithm suggestions]

## Memory Optimizations
[memory usage improvements and garbage collection tips]

## CPU Optimizations
[CPU-bound performance improvements]

## I/O Optimizations
[input/output performance improvements]

## Caching Strategies
[caching recommendations and implementations]

## Code Refactoring
[specific code changes for better performance]

## Benchmarking Recommendations
[how to measure and validate improvements]

## Profiling Guidance
[performance profiling tools and techniques]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content: "You are an expert performance engineer who specializes in identifying and resolving performance bottlenecks. Provide actionable, specific recommendations with code examples and measurable improvements.",
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
    console.error("Performance Optimizer error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to analyze performance" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

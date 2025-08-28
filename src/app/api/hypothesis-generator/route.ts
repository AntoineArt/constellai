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

    const { researchQuestion, context, variables, includeTestableHypotheses, includeResearchDesign } = await req.json();

    const prompt = `You are an expert research methodologist. Generate hypotheses based on:

Research Question: ${researchQuestion || "Research question"}
Context: ${context || "Research context"}
Variables: ${variables || "Research variables"}
Include Testable Hypotheses: ${includeTestableHypotheses ? "Yes" : "No"}
Include Research Design: ${includeResearchDesign ? "Yes" : "No"}

Create comprehensive hypotheses including:

## Hypothesis Generation

### Research Context
**Research Question**: [Main research question]
**Background**: [Research context and background]
**Variables**: [Key variables involved]

### Primary Hypothesis
**Main Hypothesis**: [Primary testable hypothesis]
**Directional Prediction**: [Expected relationship direction]
**Rationale**: [Theoretical justification]

### Alternative Hypotheses
**Null Hypothesis**: [Null hypothesis statement]
**Alternative Hypotheses**: [Additional hypotheses]
**Competing Explanations**: [Alternative explanations]

### Testable Hypotheses
[Specific testable hypotheses if requested]

### Research Design
[Research design recommendations if requested]

### Testing Strategy
**Operationalization**: [How to measure variables]
**Data Collection**: [Methods for testing hypotheses]
**Analysis Plan**: [Statistical analysis approach]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert research methodologist who creates testable, well-formulated hypotheses. Focus on providing clear, falsifiable hypotheses with proper theoretical grounding and practical testing strategies.",
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
    console.error("Hypothesis Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate hypotheses" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

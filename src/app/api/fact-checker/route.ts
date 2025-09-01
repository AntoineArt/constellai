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
    const { claim, context, includeSourceValidation, includeDetailedAnalysis } =
      body;

    const prompt = `You are an expert fact-checker and research analyst. Verify claims based on:

Claim: ${claim || "Claim to verify"}
Context: ${context || "Context"}
Include Source Validation: ${includeSourceValidation ? "Yes" : "No"}
Include Detailed Analysis: ${includeDetailedAnalysis ? "Yes" : "No"}

Create a comprehensive fact-check report including:

## Fact Check Report

### Claim Summary
**Original Claim**: [The claim being verified]
**Context**: [Background context for the claim]

### Verification Results
**Accuracy Assessment**: [Whether the claim is true, false, or partially true]
**Confidence Level**: [How confident we are in the assessment]
**Key Findings**: [Main verification results]

### Source Analysis
[Detailed source validation if requested]

### Evidence Review
**Supporting Evidence**: [Evidence that supports the claim]
**Contradicting Evidence**: [Evidence that contradicts the claim]
**Missing Information**: [Information gaps or uncertainties]

### Detailed Analysis
[In-depth analysis if requested]

### Conclusion
**Final Verdict**: [Overall assessment of claim accuracy]
**Recommendations**: [How to use this information]
**Further Research**: [Additional areas to investigate]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert fact-checker and research analyst who verifies claims with accuracy and provides reliable source validation. Focus on providing objective assessments, credible sources, and clear explanations of verification results.",
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
    console.error("Fact Checker error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fact-check claim" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

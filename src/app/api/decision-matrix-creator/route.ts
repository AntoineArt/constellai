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

    const { decision, options, criteria, weights, includeProsCons, includeRiskAnalysis } = await req.json();

    const prompt = `You are an expert decision analyst and strategic consultant. Create a decision matrix based on:

Decision: ${decision || "Decision to be made"}
Options: ${options || "Available options"}
Criteria: ${criteria || "Decision criteria"}
Weights: ${weights || "Criteria weights"}
Include Pros/Cons: ${includeProsCons ? "Yes" : "No"}
Include Risk Analysis: ${includeRiskAnalysis ? "Yes" : "No"}

Create a comprehensive decision matrix including:

## Decision Matrix Analysis

### Decision Context
[Background and context of the decision]

### Decision Framework

#### Criteria Analysis
**Criterion 1**: [Criteria description]
- **Weight**: [Importance level]
- **Description**: [What this criterion measures]

**Criterion 2**: [Criteria description]
[Continue with all criteria...]

### Decision Matrix

| Option | Criterion 1 | Criterion 2 | Criterion 3 | Total Score |
|--------|-------------|-------------|-------------|-------------|
| Option A | [Score] | [Score] | [Score] | [Weighted Total] |
| Option B | [Score] | [Score] | [Score] | [Weighted Total] |
| Option C | [Score] | [Score] | [Score] | [Weighted Total] |

### Scoring Breakdown
[Detailed explanation of how each option scores on each criterion]

### Pros and Cons Analysis
[If requested, detailed pros and cons for each option]

### Risk Assessment
[If requested, risk analysis for each option]

### Sensitivity Analysis
[How changes in weights would affect the decision]

### Recommendation
[Clear recommendation based on the analysis]

### Implementation Plan
[Next steps for implementing the chosen option]

### Monitoring Plan
[How to track the success of the decision]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert decision analyst who creates comprehensive decision matrices that help people make informed, objective decisions. Focus on creating clear criteria, fair scoring systems, and actionable recommendations based on the analysis.",
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
    console.error("Decision Matrix Creator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create decision matrix" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

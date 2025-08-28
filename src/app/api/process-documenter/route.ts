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

    const { processDescription, processType, audience, includeScreenshots, includeTroubleshooting } = await req.json();

    const prompt = `You are an expert process documentation specialist and technical writer. Create step-by-step process documentation based on:

Process Description: ${processDescription || "Process to document"}
Process Type: ${processType || "Type of process"}
Audience: ${audience || "Target audience"}
Include Screenshots: ${includeScreenshots ? "Yes" : "No"}
Include Troubleshooting: ${includeTroubleshooting ? "Yes" : "No"}

Create comprehensive process documentation including:

## Process Documentation

### Process Overview
**Process Name**: [Process name]
**Purpose**: [Why this process exists]
**Scope**: [What this process covers]
**Audience**: ${audience}

### Prerequisites
[What users need before starting this process]

### Required Materials/Tools
[Tools, software, or materials needed]

### Process Steps

#### Step 1: [Step Title]
**Action**: [What to do]
**Details**: [Detailed instructions]
**Expected Outcome**: [What should happen]
**Screenshot Placeholder**: [If requested, where screenshots would go]

#### Step 2: [Step Title]
[Continue with all steps...]

### Process Flow
[Visual or textual representation of the process flow]

### Quality Checkpoints
[Points where users should verify their work]

### Troubleshooting Guide
[If requested, common issues and solutions]

### Best Practices
[Tips for optimal process execution]

### Process Variations
[Alternative approaches or exceptions]

### Success Criteria
[How to know the process was completed successfully]

### Maintenance and Updates
[How to keep this documentation current]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert process documentation specialist who creates clear, comprehensive step-by-step process documentation. Focus on making instructions easy to follow, including all necessary details, and creating documentation that can be used by people with varying levels of expertise.",
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
    console.error("Process Documenter error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create process documentation" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

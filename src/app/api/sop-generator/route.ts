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
    const { procedure, department, compliance, includeSafety, includeQualityControl } = body;

    const prompt = `You are an expert SOP (Standard Operating Procedure) specialist and compliance consultant. Generate a comprehensive SOP based on:

Procedure: ${procedure || "Procedure to document"}
Department: ${department || "Department or team"}
Compliance: ${compliance || "Compliance requirements"}
Include Safety: ${includeSafety ? "Yes" : "No"}
Include Quality Control: ${includeQualityControl ? "Yes" : "No"}

Create a comprehensive SOP including:

## Standard Operating Procedure (SOP)

### Document Information
**SOP Title**: [Procedure name]
**Department**: ${department}
**Version**: [Version number]
**Date**: [Creation date]
**Author**: [Author name]
**Review Date**: [Next review date]

### Purpose and Scope
**Purpose**: [Why this SOP exists]
**Scope**: [What this SOP covers]
**Applicability**: [Who should follow this SOP]

### Definitions
[Key terms and definitions used in this SOP]

### Safety Considerations
[If requested, safety requirements and precautions]

### Equipment and Materials
[Required equipment, tools, and materials]

### Procedure Steps

#### Step 1: [Step Title]
**Action**: [What to do]
**Details**: [Detailed instructions]
**Safety Notes**: [Safety considerations for this step]
**Quality Check**: [Quality control points]

#### Step 2: [Step Title]
[Continue with all steps...]

### Quality Control Measures
[If requested, quality control checkpoints and standards]

### Troubleshooting
[Common issues and solutions]

### Emergency Procedures
[What to do in case of emergencies or deviations]

### Documentation Requirements
[What records need to be kept]

### Training Requirements
[Training needed to perform this procedure]

### References
[Related documents and standards]

### Approval and Review
[Approval process and review schedule]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content: "You are an expert SOP specialist who creates comprehensive, compliant standard operating procedures. Focus on creating clear, detailed procedures that ensure consistency, safety, and quality while meeting regulatory and organizational requirements.",
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
    console.error("SOP Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate SOP" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

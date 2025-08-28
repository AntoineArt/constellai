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

    const { campaignName, client, objectives, targetAudience, includeDetailedStrategy, includeDeliverables } = await req.json();

    const prompt = `You are an expert creative director and marketing strategist. Create a comprehensive creative brief based on the following information:

Campaign Name: ${campaignName || "Campaign"}
Client: ${client || "Client"}
Objectives: ${objectives || "General campaign objectives"}
Target Audience: ${targetAudience || "General audience"}
Include Detailed Strategy: ${includeDetailedStrategy ? "Yes" : "No"}
Include Deliverables: ${includeDeliverables ? "Yes" : "No"}

Please create a detailed creative brief that includes:

1. Campaign Overview
   - Campaign summary and purpose
   - Key messaging and positioning
   - Campaign goals and KPIs
   - Timeline and milestones

2. Client Background
   - Company overview and brand
   - Current market position
   - Previous campaigns and learnings
   - Brand guidelines and constraints

3. Target Audience Analysis
   - Primary and secondary audiences
   - Demographics and psychographics
   - Consumer behavior and preferences
   - Pain points and motivations

4. Campaign Objectives
   - Primary and secondary objectives
   - Measurable goals and metrics
   - Success criteria
   - ROI expectations

5. Creative Strategy
   - Creative concept and approach
   - Key messages and value propositions
   - Tone of voice and personality
   - Visual and verbal identity

6. Media Strategy (if detailed strategy requested)
   - Channel selection and rationale
   - Media mix and budget allocation
   - Timing and frequency
   - Integration opportunities

7. Creative Requirements
   - Deliverable specifications
   - Technical requirements
   - Brand compliance guidelines
   - Quality standards

8. Timeline and Process
   - Project phases and milestones
   - Review and approval process
   - Key stakeholders and roles
   - Risk management

9. Budget and Resources
   - Budget breakdown and allocation
   - Resource requirements
   - Cost considerations
   - ROI projections

10. Success Metrics
    - Performance indicators
    - Measurement methodology
    - Reporting requirements
    - Optimization strategies

Format your response as:

## Creative Brief: [Campaign Name]

### Campaign Overview
**Campaign Summary**: [Brief description of the campaign]
**Purpose**: [What the campaign aims to achieve]
**Key Messages**: [Core messaging points]
**Timeline**: [Campaign duration and key dates]

### Client Background
**Company Overview**: [Client company information]
**Brand Position**: [Current brand positioning]
**Previous Campaigns**: [Relevant past work and learnings]
**Brand Guidelines**: [Key brand requirements and constraints]

### Target Audience
**Primary Audience**: [Main target demographic and psychographic profile]
**Secondary Audience**: [Additional audience segments]
**Consumer Insights**: [Key behavioral and preference insights]
**Pain Points**: [Audience challenges and motivations]

### Campaign Objectives
**Primary Objective**: [Main campaign goal]
**Secondary Objectives**: [Supporting goals]
**Success Metrics**: [How success will be measured]
**KPIs**: [Key performance indicators]

### Creative Strategy
**Creative Concept**: [Overall creative approach and concept]
**Key Messages**: [Core value propositions and messaging]
**Tone of Voice**: [Communication style and personality]
**Visual Identity**: [Visual approach and style guidelines]

### Media Strategy
[Detailed media strategy if requested]

### Creative Requirements
**Deliverables**: [Required creative assets and formats]
**Technical Specifications**: [Technical requirements and standards]
**Brand Compliance**: [Brand guideline adherence requirements]
**Quality Standards**: [Quality and performance expectations]

### Timeline and Process
**Project Phases**: [Key project milestones and phases]
**Review Process**: [Approval workflow and stakeholders]
**Key Stakeholders**: [Important decision makers and roles]
**Risk Management**: [Potential challenges and mitigation strategies]

### Budget and Resources
**Budget Allocation**: [Budget breakdown by category]
**Resource Requirements**: [Team and resource needs]
**Cost Considerations**: [Budget constraints and considerations]
**ROI Projections**: [Expected return on investment]

### Success Metrics
**Performance Indicators**: [Specific metrics to track]
**Measurement Methodology**: [How metrics will be measured]
**Reporting Requirements**: [Reporting frequency and format]
**Optimization Strategy**: [How to improve performance]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert creative director and marketing strategist who creates comprehensive, actionable creative briefs. Focus on providing clear direction, measurable objectives, and strategic insights that guide successful campaign execution.",
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
    console.error("Creative Brief Writer error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate creative brief" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

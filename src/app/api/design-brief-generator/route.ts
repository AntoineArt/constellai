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

    const { projectName, clientRequirements, targetAudience, designGoals, includeTechnicalSpecs, includeTimeline } = await req.json();

    const prompt = `You are an expert design strategist and project manager. Create a comprehensive design brief based on the following information:

Project Name: ${projectName || "Project name"}
Client Requirements: ${clientRequirements || "General requirements"}
Target Audience: ${targetAudience || "General audience"}
Design Goals: ${designGoals || "Create effective design"}
Include Technical Specifications: ${includeTechnicalSpecs ? "Yes" : "No"}
Include Timeline: ${includeTimeline ? "Yes" : "No"}

Please create a detailed design brief that includes:

1. Project Overview
   - Project summary and objectives
   - Key deliverables
   - Success metrics

2. Client Information
   - Company background
   - Brand guidelines
   - Existing assets

3. Target Audience Analysis
   - Demographics and psychographics
   - User personas
   - User journey considerations

4. Design Requirements
   - Functional requirements
   - Visual requirements
   - Content requirements

5. Design Goals and Objectives
   - Primary goals
   - Secondary objectives
   - Measurable outcomes

6. Technical Specifications (if requested)
   - Platform requirements
   - File formats
   - Technical constraints

7. Timeline and Milestones (if requested)
   - Project phases
   - Key milestones
   - Review cycles

8. Budget and Resources
   - Budget considerations
   - Resource requirements
   - Third-party dependencies

9. Success Criteria
   - Performance metrics
   - Quality standards
   - Approval process

Format your response as:

## Design Brief: [Project Name]

### Project Overview
**Project Summary**: [Brief project description]
**Objectives**: [Key project objectives]
**Deliverables**: [List of deliverables]
**Success Metrics**: [How success will be measured]

### Client Information
**Company Background**: [Client company information]
**Brand Guidelines**: [Existing brand elements]
**Current Assets**: [Available materials and resources]

### Target Audience
**Primary Audience**: [Detailed audience description]
**User Personas**: [Key user personas]
**User Journey**: [User experience considerations]

### Design Requirements
**Functional Requirements**: [What the design needs to do]
**Visual Requirements**: [Visual style and elements]
**Content Requirements**: [Content needs and specifications]

### Design Goals
**Primary Goals**: [Main design objectives]
**Secondary Objectives**: [Additional goals]
**Measurable Outcomes**: [Specific success indicators]

### Technical Specifications
[Technical requirements and constraints if requested]

### Timeline and Milestones
[Project timeline and key milestones if requested]

### Budget and Resources
**Budget Considerations**: [Budget guidelines and constraints]
**Resource Requirements**: [Team and tool requirements]
**Dependencies**: [Third-party services or resources]

### Success Criteria
**Performance Metrics**: [How performance will be measured]
**Quality Standards**: [Quality benchmarks]
**Approval Process**: [Review and approval workflow]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert design strategist and project manager who creates comprehensive, actionable design briefs. Focus on creating briefs that are clear, detailed, and provide all necessary information for successful design execution.",
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
    console.error("Design Brief Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate design brief" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

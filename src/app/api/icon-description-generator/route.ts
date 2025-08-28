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

    const { iconPurpose, style, context, includeTechnicalSpecs, includeAccessibility } = await req.json();

    const prompt = `You are an expert icon designer and UX specialist. Create detailed icon descriptions based on the following information:

Icon Purpose: ${iconPurpose || "General icon"}
Style: ${style || "Modern"}
Context: ${context || "General use"}
Include Technical Specifications: ${includeTechnicalSpecs ? "Yes" : "No"}
Include Accessibility Guidelines: ${includeAccessibility ? "Yes" : "No"}

Please create comprehensive icon descriptions that include:

1. Visual Description
   - Shape and form details
   - Style characteristics
   - Visual elements and composition

2. Functional Description
   - Purpose and meaning
   - User interaction context
   - Behavioral expectations

3. Design Guidelines
   - Style consistency
   - Visual hierarchy
   - Brand alignment

4. Technical Specifications (if requested)
   - File formats and sizes
   - Resolution requirements
   - Export specifications

5. Accessibility Guidelines (if requested)
   - Screen reader descriptions
   - Alternative text suggestions
   - WCAG compliance notes

6. Implementation Guidelines
   - Usage recommendations
   - Placement suggestions
   - Integration tips

7. Variations and States
   - Different states (hover, active, disabled)
   - Size variations
   - Context-specific versions

Format your response as:

## Icon Description: [Icon Purpose]

### Visual Description
**Shape and Form**: [Detailed description of the icon's visual elements]
**Style Characteristics**: [Style-specific details and characteristics]
**Composition**: [How elements are arranged and balanced]

### Functional Description
**Purpose**: [What the icon represents and communicates]
**User Context**: [How users will interact with this icon]
**Behavioral Expectations**: [What users expect when they see this icon]

### Design Guidelines
**Style Consistency**: [How to maintain consistency with the design system]
**Visual Hierarchy**: [How this icon fits into the overall hierarchy]
**Brand Alignment**: [How it aligns with brand guidelines]

### Technical Specifications
[Technical requirements and specifications if requested]

### Accessibility Guidelines
[Accessibility considerations and alt text suggestions if requested]

### Implementation Guidelines
**Usage Recommendations**: [When and how to use this icon]
**Placement Suggestions**: [Optimal placement and positioning]
**Integration Tips**: [How to integrate with existing systems]

### Variations and States
**Interactive States**: [Hover, active, disabled states]
**Size Variations**: [Different size requirements]
**Context Variations**: [Different contexts where this icon might appear]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert icon designer and UX specialist who creates clear, detailed, and actionable icon descriptions. Focus on creating descriptions that help designers and developers understand both the visual and functional aspects of icons.",
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
    console.error("Icon Description Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate icon description" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

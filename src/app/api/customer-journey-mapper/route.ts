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

    const { businessType, customerSegments, currentJourney, includeDetailedMapping, includeOptimizationRecommendations } = await req.json();

    const prompt = `You are an expert customer experience strategist and journey mapping consultant. Create a comprehensive customer journey map based on the following information:

Business Type: ${businessType || "General Business"}
Customer Segments: ${customerSegments || "General customers"}
Current Journey: ${currentJourney || "Current customer journey"}
Include Detailed Mapping: ${includeDetailedMapping ? "Yes" : "No"}
Include Optimization Recommendations: ${includeOptimizationRecommendations ? "Yes" : "No"}

Please create a detailed customer journey map that includes:

1. Executive Summary
   - Journey mapping overview and objectives
   - Key customer segments and personas
   - Journey scope and boundaries
   - Strategic insights and opportunities

2. Customer Personas
   - Primary customer personas
   - Secondary customer segments
   - Demographics and psychographics
   - Goals, motivations, and pain points

3. Journey Stages
   - Awareness and discovery
   - Consideration and research
   - Decision and purchase
   - Onboarding and adoption
   - Usage and engagement
   - Support and service
   - Retention and loyalty

4. Touchpoint Mapping (if detailed mapping requested)
   - Digital touchpoints (website, app, social media)
   - Physical touchpoints (stores, events, locations)
   - Human touchpoints (sales, support, service)
   - Communication touchpoints (email, phone, chat)

5. Customer Experience Analysis
   - Emotional journey mapping
   - Pain points and friction areas
   - Moments of truth and delight
   - Experience gaps and opportunities

6. Channel and Platform Mapping
   - Multi-channel journey flows
   - Platform-specific experiences
   - Cross-channel consistency
   - Omnichannel integration

7. Customer Insights
   - Behavioral patterns and preferences
   - Decision-making processes
   - Communication preferences
   - Technology adoption patterns

8. Optimization Recommendations (if requested)
   - Experience improvement opportunities
   - Process optimization suggestions
   - Technology and automation recommendations
   - Personalization and customization strategies

9. Implementation Roadmap
   - Priority improvement areas
   - Quick wins and long-term initiatives
   - Resource requirements and timeline
   - Success metrics and KPIs

10. Monitoring and Measurement
    - Customer journey analytics
    - Performance tracking metrics
    - Feedback collection methods
    - Continuous improvement processes

Format your response as:

## Customer Journey Map: [Business Type]

### Executive Summary
**Journey Overview**: [Brief description of the customer journey mapping]
**Key Segments**: [Main customer segments and personas]
**Journey Scope**: [What aspects of the journey are being mapped]
**Strategic Insights**: [Key findings and opportunities]

### Customer Personas
**Primary Personas**: [Main customer personas and characteristics]
**Secondary Segments**: [Additional customer segments]
**Demographics**: [Age, location, income, etc.]
**Psychographics**: [Values, interests, lifestyle, etc.]
**Goals and Motivations**: [What customers want to achieve]
**Pain Points**: [Customer challenges and frustrations]

### Journey Stages
**Awareness**: [How customers discover your business]
**Consideration**: [How customers research and evaluate]
**Decision**: [How customers make purchase decisions]
**Onboarding**: [How customers get started]
**Usage**: [How customers use your product/service]
**Support**: [How customers get help and support]
**Retention**: [How customers stay engaged and loyal]

### Touchpoint Mapping
[Detailed touchpoint analysis if requested]

### Customer Experience Analysis
**Emotional Journey**: [Customer emotions throughout the journey]
**Pain Points**: [Areas of friction and frustration]
**Moments of Truth**: [Critical decision and experience points]
**Delight Moments**: [Opportunities to exceed expectations]
**Experience Gaps**: [Areas where experience falls short]

### Channel and Platform Mapping
**Digital Channels**: [Website, mobile app, social media experiences]
**Physical Channels**: [In-person and location-based experiences]
**Human Interactions**: [Sales, support, and service interactions]
**Communication Channels**: [Email, phone, chat, and messaging]
**Cross-Channel Consistency**: [How experiences align across channels]

### Customer Insights
**Behavioral Patterns**: [How customers typically behave]
**Decision Processes**: [How customers make decisions]
**Communication Preferences**: [Preferred channels and formats]
**Technology Adoption**: [How customers use technology]

### Optimization Recommendations
[Detailed optimization strategies if requested]

### Implementation Roadmap
**Priority Areas**: [Most important improvements to focus on]
**Quick Wins**: [Easy improvements with immediate impact]
**Long-term Initiatives**: [Strategic improvements requiring time]
**Resource Requirements**: [People, budget, and tools needed]
**Timeline**: [Implementation schedule and milestones]

### Monitoring and Measurement
**Journey Analytics**: [Key metrics to track customer journey performance]
**Performance Tracking**: [How to measure success and progress]
**Feedback Collection**: [Methods for gathering customer feedback]
**Continuous Improvement**: [Process for ongoing optimization]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert customer experience strategist and journey mapping consultant who creates comprehensive, actionable customer journey maps. Focus on providing clear insights, practical recommendations, and strategic guidance that helps organizations improve customer experiences and drive business growth.",
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
    console.error("Customer Journey Mapper error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate customer journey map" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

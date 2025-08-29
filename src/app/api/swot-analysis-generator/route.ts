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
    const { businessName, industry, currentSituation, includeDetailedAnalysis, includeActionPlans } = body;

    const prompt = `You are an expert business strategist and consultant. Create a comprehensive SWOT analysis based on the following information:

Business/Organization Name: ${businessName || "Organization"}
Industry: ${industry || "General"}
Current Situation: ${currentSituation || "General business situation"}
Include Detailed Analysis: ${includeDetailedAnalysis ? "Yes" : "No"}
Include Action Plans: ${includeActionPlans ? "Yes" : "No"}

Please create a detailed SWOT analysis that includes:

1. Strengths (Internal Positive Factors)
   - Core competencies
   - Competitive advantages
   - Resources and capabilities
   - Market position

2. Weaknesses (Internal Negative Factors)
   - Areas for improvement
   - Resource limitations
   - Competitive disadvantages
   - Operational challenges

3. Opportunities (External Positive Factors)
   - Market trends
   - Growth potential
   - Strategic partnerships
   - Emerging technologies

4. Threats (External Negative Factors)
   - Market competition
   - Economic factors
   - Regulatory changes
   - Technological disruption

5. Strategic Implications (if detailed analysis requested)
   - How strengths can be leveraged
   - How weaknesses can be addressed
   - How opportunities can be captured
   - How threats can be mitigated

6. Action Plans (if requested)
   - Priority actions
   - Implementation timeline
   - Resource requirements
   - Success metrics

Format your response as:

## SWOT Analysis: [Business Name]

### Strengths (Internal Positive Factors)
**Core Competencies**: [Key strengths and capabilities]
**Competitive Advantages**: [What sets the organization apart]
**Resources**: [Available resources and assets]
**Market Position**: [Current market standing]

### Weaknesses (Internal Negative Factors)
**Areas for Improvement**: [Internal challenges and limitations]
**Resource Constraints**: [Limited resources or capabilities]
**Competitive Disadvantages**: [Areas where competitors excel]
**Operational Challenges**: [Internal operational issues]

### Opportunities (External Positive Factors)
**Market Trends**: [Favorable market developments]
**Growth Potential**: [Areas for expansion and growth]
**Strategic Partnerships**: [Partnership opportunities]
**Emerging Technologies**: [Technology opportunities]

### Threats (External Negative Factors)
**Market Competition**: [Competitive threats]
**Economic Factors**: [Economic challenges]
**Regulatory Changes**: [Regulatory threats]
**Technological Disruption**: [Technology threats]

### Strategic Implications
[Detailed analysis of how each factor impacts strategy if requested]

### Action Plans
[Specific action plans and recommendations if requested]

### Priority Matrix
[Prioritized list of key factors and actions]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content: "You are an expert business strategist and consultant who creates comprehensive, actionable SWOT analyses. Focus on providing insights that are specific, relevant, and actionable for strategic planning.",
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
    console.error("SWOT Analysis Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate SWOT analysis" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

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

    const { researchTopic, dataSources, targetMarket, includeCompetitiveAnalysis, includeActionableInsights } = await req.json();

    const prompt = `You are an expert market research analyst and business strategist. Create a comprehensive market research synthesis based on the following information:

Research Topic: ${researchTopic || "Market research topic"}
Data Sources: ${dataSources || "General market data"}
Target Market: ${targetMarket || "General market"}
Include Competitive Analysis: ${includeCompetitiveAnalysis ? "Yes" : "No"}
Include Actionable Insights: ${includeActionableInsights ? "Yes" : "No"}

Please create a detailed market research synthesis that includes:

1. Executive Summary
   - Key findings and insights
   - Market overview and trends
   - Critical success factors
   - Strategic implications

2. Market Overview
   - Market size and growth potential
   - Market segmentation and demographics
   - Geographic distribution
   - Market maturity and lifecycle stage

3. Market Trends and Drivers
   - Current market trends
   - Growth drivers and inhibitors
   - Technological advancements
   - Regulatory and economic factors

4. Customer Analysis
   - Customer segments and personas
   - Buying behavior and preferences
   - Pain points and needs
   - Customer journey and touchpoints

5. Competitive Landscape (if requested)
   - Key competitors and market share
   - Competitive positioning and strategies
   - Strengths and weaknesses analysis
   - Competitive advantages and differentiators

6. Market Opportunities
   - Untapped market segments
   - Emerging opportunities
   - Market gaps and white spaces
   - Growth potential areas

7. Market Challenges and Risks
   - Market barriers and challenges
   - Potential risks and threats
   - Market volatility factors
   - Mitigation strategies

8. Strategic Recommendations (if actionable insights requested)
   - Market entry strategies
   - Product development recommendations
   - Marketing and positioning strategies
   - Partnership and collaboration opportunities

9. Data Analysis and Methodology
   - Research methodology overview
   - Data collection and analysis approach
   - Key metrics and KPIs
   - Data reliability and limitations

10. Future Outlook
    - Market projections and forecasts
    - Emerging trends and predictions
    - Long-term market evolution
    - Strategic planning implications

Format your response as:

## Market Research Synthesis: [Research Topic]

### Executive Summary
**Key Findings**: [Main insights and discoveries]
**Market Overview**: [Brief market description and current state]
**Critical Success Factors**: [Key factors for success in this market]
**Strategic Implications**: [What this means for business strategy]

### Market Overview
**Market Size**: [Current market size and growth metrics]
**Market Segmentation**: [Key market segments and demographics]
**Geographic Distribution**: [Regional market breakdown]
**Market Maturity**: [Current stage of market development]

### Market Trends and Drivers
**Current Trends**: [Major trends shaping the market]
**Growth Drivers**: [Factors driving market growth]
**Technological Factors**: [Technology impact on the market]
**Regulatory Environment**: [Regulatory factors affecting the market]

### Customer Analysis
**Customer Segments**: [Key customer groups and personas]
**Buying Behavior**: [How customers make purchasing decisions]
**Pain Points**: [Customer challenges and unmet needs]
**Customer Journey**: [Customer experience and touchpoints]

### Competitive Landscape
[Detailed competitive analysis if requested]

### Market Opportunities
**Untapped Segments**: [Market segments with growth potential]
**Emerging Opportunities**: [New and developing opportunities]
**Market Gaps**: [Areas where needs are not being met]
**Growth Potential**: [Areas with high growth potential]

### Market Challenges and Risks
**Market Barriers**: [Obstacles to market entry or growth]
**Potential Risks**: [Risks and threats to consider]
**Market Volatility**: [Factors causing market uncertainty]
**Mitigation Strategies**: [How to address challenges and risks]

### Strategic Recommendations
[Actionable strategic recommendations if requested]

### Data Analysis and Methodology
**Research Approach**: [How the research was conducted]
**Data Sources**: [Sources of market data and information]
**Key Metrics**: [Important measurements and KPIs]
**Data Limitations**: [Limitations and considerations of the data]

### Future Outlook
**Market Projections**: [Future market size and growth predictions]
**Emerging Trends**: [Trends likely to shape the future market]
**Long-term Evolution**: [How the market is expected to evolve]
**Strategic Planning**: [Implications for long-term planning]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert market research analyst and business strategist who creates comprehensive, data-driven market research syntheses. Focus on providing actionable insights, clear market understanding, and strategic recommendations based on thorough analysis.",
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
    console.error("Market Research Synthesizer error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate market research synthesis" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

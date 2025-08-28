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

    const { companyName, industry, competitors, includeDetailedAnalysis, includeStrategicRecommendations } = await req.json();

    const prompt = `You are an expert competitive intelligence analyst and business strategist. Create a comprehensive competitor analysis based on the following information:

Company Name: ${companyName || "Your Company"}
Industry: ${industry || "General Industry"}
Competitors: ${competitors || "General competitors"}
Include Detailed Analysis: ${includeDetailedAnalysis ? "Yes" : "No"}
Include Strategic Recommendations: ${includeStrategicRecommendations ? "Yes" : "No"}

Please create a detailed competitor analysis that includes:

1. Executive Summary
   - Key competitive insights
   - Market positioning overview
   - Critical competitive advantages
   - Strategic implications

2. Market Landscape Analysis
   - Industry overview and dynamics
   - Market share distribution
   - Competitive intensity
   - Market growth and trends

3. Competitor Profiles
   - Individual competitor analysis
   - Strengths and weaknesses
   - Market positioning
   - Key differentiators

4. Competitive Positioning
   - Your company's position vs competitors
   - Competitive advantages and disadvantages
   - Market positioning map
   - Value proposition comparison

5. Product/Service Analysis
   - Feature comparison matrix
   - Pricing analysis
   - Quality and performance comparison
   - Innovation and R&D focus

6. Marketing and Sales Analysis
   - Marketing strategies comparison
   - Sales approaches and channels
   - Customer acquisition strategies
   - Brand positioning and messaging

7. Financial Performance Comparison
   - Revenue and growth metrics
   - Profitability analysis
   - Investment and funding
   - Financial health indicators

8. Technology and Innovation
   - Technology stack comparison
   - Innovation capabilities
   - Digital transformation initiatives
   - Future technology roadmap

9. Customer Analysis
   - Customer segments and targeting
   - Customer satisfaction and loyalty
   - Customer acquisition and retention
   - Customer experience comparison

10. Strategic Recommendations (if requested)
    - Competitive positioning strategies
    - Market entry or expansion opportunities
    - Product development priorities
    - Partnership and acquisition opportunities

Format your response as:

## Competitor Analysis: [Company Name]

### Executive Summary
**Key Competitive Insights**: [Main competitive findings and observations]
**Market Position**: [Your company's position in the competitive landscape]
**Critical Advantages**: [Your key competitive advantages]
**Strategic Implications**: [What this means for your strategy]

### Market Landscape Analysis
**Industry Overview**: [Industry dynamics and competitive environment]
**Market Share**: [Market share distribution among competitors]
**Competitive Intensity**: [Level of competition in the market]
**Market Trends**: [Key trends affecting competition]

### Competitor Profiles
**Competitor 1**: [Name and brief overview]
- **Strengths**: [Key strengths and advantages]
- **Weaknesses**: [Areas of vulnerability]
- **Market Position**: [Position in the market]
- **Key Differentiators**: [What makes them unique]

**Competitor 2**: [Name and brief overview]
- **Strengths**: [Key strengths and advantages]
- **Weaknesses**: [Areas of vulnerability]
- **Market Position**: [Position in the market]
- **Key Differentiators**: [What makes them unique]

[Continue for other competitors]

### Competitive Positioning
**Your Position**: [Where your company stands relative to competitors]
**Competitive Advantages**: [Your key advantages over competitors]
**Competitive Disadvantages**: [Areas where competitors have advantages]
**Positioning Strategy**: [How to position against competitors]

### Product/Service Analysis
**Feature Comparison**: [Key features and capabilities comparison]
**Pricing Analysis**: [Pricing strategies and price points]
**Quality Comparison**: [Product/service quality assessment]
**Innovation Focus**: [Areas of innovation and development]

### Marketing and Sales Analysis
**Marketing Strategies**: [Different marketing approaches used]
**Sales Channels**: [Sales channel strategies and effectiveness]
**Customer Acquisition**: [How competitors acquire customers]
**Brand Positioning**: [Brand messaging and positioning]

### Financial Performance Comparison
**Revenue Metrics**: [Revenue growth and performance]
**Profitability**: [Profit margins and financial health]
**Investment**: [Funding and investment strategies]
**Financial Stability**: [Financial strength and stability]

### Technology and Innovation
**Technology Stack**: [Technology platforms and tools used]
**Innovation Capabilities**: [Innovation and R&D focus areas]
**Digital Initiatives**: [Digital transformation efforts]
**Future Roadmap**: [Technology and innovation plans]

### Customer Analysis
**Customer Segments**: [Target customer groups]
**Customer Satisfaction**: [Customer satisfaction and loyalty metrics]
**Acquisition Strategies**: [Customer acquisition approaches]
**Customer Experience**: [Customer experience and service quality]

### Strategic Recommendations
[Detailed strategic recommendations if requested]

### Action Items
**Immediate Actions**: [Short-term competitive responses]
**Strategic Initiatives**: [Long-term competitive strategies]
**Resource Requirements**: [Resources needed for competitive response]
**Success Metrics**: [How to measure competitive success]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert competitive intelligence analyst and business strategist who creates comprehensive, actionable competitor analyses. Focus on providing insights that help businesses understand their competitive position and develop effective strategies.",
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
    console.error("Competitor Analysis Tool error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate competitor analysis" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

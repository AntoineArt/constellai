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

    const { productService, targetMarket, costStructure, competitiveLandscape, includeDetailedAnalysis, includeCompetitivePositioning } = await req.json();

    const prompt = `You are an expert pricing strategist and market analyst. Create a comprehensive pricing strategy based on the following information:

Product/Service: ${productService || "Product or Service"}
Target Market: ${targetMarket || "Target market"}
Cost Structure: ${costStructure || "Cost structure"}
Competitive Landscape: ${competitiveLandscape || "Competitive landscape"}
Include Detailed Analysis: ${includeDetailedAnalysis ? "Yes" : "No"}
Include Competitive Positioning: ${includeCompetitivePositioning ? "Yes" : "No"}

Please create a detailed pricing strategy that includes:

1. Executive Summary
   - Pricing strategy overview and objectives
   - Key pricing recommendations
   - Expected market positioning
   - Revenue and profitability projections

2. Market Analysis
   - Target market segmentation
   - Customer value perception
   - Market demand analysis
   - Price sensitivity assessment

3. Cost Analysis
   - Cost structure breakdown
   - Variable and fixed costs
   - Profit margin requirements
   - Break-even analysis

4. Competitive Analysis
   - Competitor pricing analysis
   - Market positioning comparison
   - Competitive advantages
   - Price differentiation opportunities

5. Pricing Models and Strategies
   - Recommended pricing models
   - Pricing strategy options
   - Value-based pricing approach
   - Dynamic pricing considerations

6. Price Optimization (if detailed analysis requested)
   - Price elasticity analysis
   - Optimal price point determination
   - Price sensitivity testing
   - Revenue optimization strategies

7. Competitive Positioning (if requested)
   - Market positioning strategy
   - Competitive differentiation
   - Value proposition alignment
   - Brand positioning considerations

8. Pricing Structure
   - Base pricing recommendations
   - Tiered pricing options
   - Discount and promotion strategies
   - Bundling and packaging options

9. Implementation Plan
   - Pricing rollout strategy
   - Market testing approach
   - Communication and messaging
   - Monitoring and adjustment

10. Risk Management
    - Pricing risks and challenges
    - Market reaction scenarios
    - Competitive response strategies
    - Contingency planning

Format your response as:

## Pricing Strategy: [Product/Service]

### Executive Summary
**Strategy Overview**: [Brief description of the pricing strategy]
**Key Recommendations**: [Main pricing recommendations and approach]
**Market Positioning**: [Expected market position and perception]
**Revenue Projections**: [Expected revenue and profitability outcomes]

### Market Analysis
**Target Market**: [Detailed market segmentation and characteristics]
**Customer Value**: [How customers perceive value and benefits]
**Market Demand**: [Demand analysis and market size considerations]
**Price Sensitivity**: [Customer price sensitivity and elasticity]

### Cost Analysis
**Cost Structure**: [Breakdown of costs and cost drivers]
**Variable Costs**: [Costs that vary with production/volume]
**Fixed Costs**: [Fixed operational and overhead costs]
**Profit Margins**: [Required and target profit margins]

### Competitive Analysis
**Competitor Pricing**: [Analysis of competitor pricing strategies]
**Market Positioning**: [How competitors are positioned in the market]
**Competitive Advantages**: [Your unique advantages and differentiators]
**Price Differentiation**: [Opportunities for price differentiation]

### Pricing Models and Strategies
**Recommended Models**: [Specific pricing models to consider]
**Strategy Options**: [Different pricing strategy approaches]
**Value-Based Pricing**: [How to price based on customer value]
**Dynamic Pricing**: [Considerations for dynamic pricing]

### Price Optimization
[Detailed price optimization analysis if requested]

### Competitive Positioning
[Detailed competitive positioning strategy if requested]

### Pricing Structure
**Base Pricing**: [Recommended base prices and price points]
**Tiered Options**: [Different pricing tiers and levels]
**Discount Strategy**: [When and how to offer discounts]
**Bundling Options**: [Product/service bundling strategies]

### Implementation Plan
**Rollout Strategy**: [How to implement the pricing strategy]
**Market Testing**: [Approach to testing pricing in the market]
**Communication**: [How to communicate pricing changes]
**Monitoring**: [How to track and measure pricing performance]

### Risk Management
**Pricing Risks**: [Potential risks and challenges]
**Market Reactions**: [How the market might react to pricing]
**Competitive Response**: [How competitors might respond]
**Contingency Plans**: [Backup plans and adjustments]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert pricing strategist and market analyst who creates comprehensive, data-driven pricing strategies. Focus on providing clear recommendations, competitive analysis, and actionable implementation plans that help businesses optimize their pricing for maximum profitability and market success.",
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
    console.error("Pricing Strategy Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate pricing strategy" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

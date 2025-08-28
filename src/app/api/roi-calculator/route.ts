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

    const { investmentType, initialInvestment, expectedReturns, timePeriod, additionalCosts, includeDetailedAnalysis, includeRecommendations } = await req.json();

    const prompt = `You are an expert financial analyst and investment consultant. Create a comprehensive ROI analysis based on the following information:

Investment Type: ${investmentType || "General Investment"}
Initial Investment: ${initialInvestment || "Investment amount"}
Expected Returns: ${expectedReturns || "Expected returns"}
Time Period: ${timePeriod || "Investment period"}
Additional Costs: ${additionalCosts || "Additional costs"}
Include Detailed Analysis: ${includeDetailedAnalysis ? "Yes" : "No"}
Include Recommendations: ${includeRecommendations ? "Yes" : "No"}

Please create a detailed ROI analysis that includes:

1. Executive Summary
   - Key ROI metrics and calculations
   - Investment overview and objectives
   - Expected performance summary
   - Risk and return profile

2. ROI Calculations
   - Basic ROI calculation and formula
   - Annualized ROI calculation
   - Net present value (NPV) analysis
   - Internal rate of return (IRR) calculation
   - Payback period analysis

3. Investment Breakdown
   - Initial investment components
   - Ongoing costs and expenses
   - Revenue and return streams
   - Cash flow projections
   - Break-even analysis

4. Financial Metrics
   - Return on investment (ROI) percentage
   - Return on equity (ROE) if applicable
   - Return on assets (ROA) if applicable
   - Profit margin analysis
   - Cost-benefit ratio

5. Risk Analysis (if detailed analysis requested)
   - Investment risks and uncertainties
   - Market risk factors
   - Operational risks
   - Financial risks
   - Risk-adjusted returns

6. Comparative Analysis
   - Industry benchmarks and standards
   - Alternative investment options
   - Opportunity cost analysis
   - Competitive positioning

7. Sensitivity Analysis
   - Best-case scenario projections
   - Worst-case scenario projections
   - Most likely scenario
   - Key variables and assumptions

8. Timeline and Milestones
   - Investment timeline and phases
   - Key milestones and checkpoints
   - Performance tracking points
   - Review and adjustment periods

9. Recommendations (if requested)
   - Investment decision recommendations
   - Risk mitigation strategies
   - Optimization opportunities
   - Alternative approaches

10. Implementation Plan
    - Next steps and action items
    - Resource requirements
    - Monitoring and reporting
    - Success metrics and KPIs

Format your response as:

## ROI Analysis: [Investment Type]

### Executive Summary
**Investment Overview**: [Brief description of the investment]
**Key ROI Metrics**: [Main ROI calculations and percentages]
**Expected Performance**: [Summary of expected returns and timeline]
**Risk Profile**: [Overall risk assessment and return profile]

### ROI Calculations
**Basic ROI**: [ROI percentage calculation and formula]
**Annualized ROI**: [Annualized return calculation]
**Net Present Value**: [NPV calculation and interpretation]
**Internal Rate of Return**: [IRR calculation and significance]
**Payback Period**: [Time to recover initial investment]

### Investment Breakdown
**Initial Investment**: [Breakdown of upfront costs]
**Ongoing Costs**: [Recurring expenses and operational costs]
**Revenue Streams**: [Expected income and return sources]
**Cash Flow Projections**: [Expected cash flow over time]
**Break-even Analysis**: [When the investment becomes profitable]

### Financial Metrics
**ROI Percentage**: [Calculated return on investment]
**Return on Equity**: [ROE calculation if applicable]
**Return on Assets**: [ROA calculation if applicable]
**Profit Margins**: [Expected profit margin analysis]
**Cost-Benefit Ratio**: [Cost to benefit comparison]

### Risk Analysis
[Detailed risk assessment if requested]

### Comparative Analysis
**Industry Benchmarks**: [How this investment compares to industry standards]
**Alternative Options**: [Comparison with other investment opportunities]
**Opportunity Cost**: [What is being given up for this investment]
**Competitive Position**: [How this investment positions the business]

### Sensitivity Analysis
**Best-Case Scenario**: [Optimistic projections and assumptions]
**Worst-Case Scenario**: [Pessimistic projections and risk factors]
**Most Likely Scenario**: [Realistic projections based on current data]
**Key Variables**: [Factors that most affect ROI outcomes]

### Timeline and Milestones
**Investment Timeline**: [Phases and stages of the investment]
**Key Milestones**: [Important checkpoints and decision points]
**Performance Tracking**: [How to monitor and measure progress]
**Review Periods**: [When to assess and adjust the investment]

### Recommendations
[Investment recommendations and strategic advice if requested]

### Implementation Plan
**Next Steps**: [Immediate actions to take]
**Resource Requirements**: [People, budget, and tools needed]
**Monitoring Plan**: [How to track and report on performance]
**Success Metrics**: [KPIs and success indicators]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert financial analyst and investment consultant who creates comprehensive, accurate ROI analyses. Focus on providing clear calculations, practical insights, and actionable recommendations that help stakeholders make informed investment decisions.",
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
    console.error("ROI Calculator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate ROI analysis" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

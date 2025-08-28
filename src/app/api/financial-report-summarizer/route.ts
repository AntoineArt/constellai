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

    const { companyName, reportType, financialData, includeKeyInsights, includeRecommendations } = await req.json();

    const prompt = `You are an expert financial analyst and business consultant. Create a comprehensive financial report summary based on the following information:

Company Name: ${companyName || "Company"}
Report Type: ${reportType || "Financial Report"}
Financial Data: ${financialData || "General financial information"}
Include Key Insights: ${includeKeyInsights ? "Yes" : "No"}
Include Recommendations: ${includeRecommendations ? "Yes" : "No"}

Please create a detailed financial report summary that includes:

1. Executive Summary
   - Key financial highlights
   - Performance overview
   - Critical financial metrics
   - Strategic implications

2. Financial Performance Analysis
   - Revenue and growth analysis
   - Profitability metrics
   - Cash flow analysis
   - Balance sheet overview

3. Key Financial Ratios
   - Liquidity ratios
   - Profitability ratios
   - Efficiency ratios
   - Leverage ratios

4. Trend Analysis
   - Historical performance trends
   - Year-over-year comparisons
   - Seasonal patterns
   - Growth trajectory

5. Risk Assessment
   - Financial risk factors
   - Market risk considerations
   - Operational risks
   - Credit and liquidity risks

6. Industry Comparison
   - Peer benchmarking
   - Industry averages
   - Competitive positioning
   - Market share analysis

7. Key Insights (if requested)
   - Critical observations
   - Performance drivers
   - Risk factors
   - Opportunities and threats

8. Strategic Recommendations (if requested)
   - Financial optimization strategies
   - Risk mitigation approaches
   - Growth opportunities
   - Investment recommendations

9. Financial Projections
   - Future performance outlook
   - Growth projections
   - Risk scenarios
   - Strategic planning implications

10. Action Items
    - Priority actions
    - Implementation timeline
    - Resource requirements
    - Success metrics

Format your response as:

## Financial Report Summary: [Company Name]

### Executive Summary
**Key Highlights**: [Main financial achievements and metrics]
**Performance Overview**: [Overall financial performance summary]
**Critical Metrics**: [Most important financial indicators]
**Strategic Implications**: [What the numbers mean for strategy]

### Financial Performance Analysis
**Revenue Analysis**: [Revenue performance and growth analysis]
**Profitability Metrics**: [Profit margins and earnings analysis]
**Cash Flow Analysis**: [Cash flow performance and trends]
**Balance Sheet Overview**: [Asset, liability, and equity analysis]

### Key Financial Ratios
**Liquidity Ratios**: [Current ratio, quick ratio, cash ratio]
**Profitability Ratios**: [ROE, ROA, profit margins]
**Efficiency Ratios**: [Asset turnover, inventory turnover]
**Leverage Ratios**: [Debt-to-equity, debt-to-assets]

### Trend Analysis
**Historical Trends**: [Performance trends over time]
**Year-over-Year Comparison**: [Annual performance changes]
**Seasonal Patterns**: [Seasonal variations and patterns]
**Growth Trajectory**: [Growth rate and trajectory analysis]

### Risk Assessment
**Financial Risks**: [Key financial risk factors]
**Market Risks**: [Market-related risk considerations]
**Operational Risks**: [Operational risk factors]
**Credit and Liquidity**: [Credit and liquidity risk analysis]

### Industry Comparison
**Peer Benchmarking**: [Comparison with industry peers]
**Industry Averages**: [Performance vs. industry standards]
**Competitive Position**: [Market position and competitiveness]
**Market Share**: [Market share analysis and trends]

### Key Insights
[Critical observations and insights if requested]

### Strategic Recommendations
[Strategic recommendations and action items if requested]

### Financial Projections
**Future Outlook**: [Projected financial performance]
**Growth Projections**: [Expected growth rates and trends]
**Risk Scenarios**: [Different risk and growth scenarios]
**Strategic Planning**: [Implications for strategic planning]

### Action Items
**Priority Actions**: [Immediate action items]
**Implementation Timeline**: [Timeline for key initiatives]
**Resource Requirements**: [Resources needed for implementation]
**Success Metrics**: [How to measure success]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert financial analyst and business consultant who creates comprehensive, insightful financial report summaries. Focus on providing clear analysis, actionable insights, and strategic recommendations based on thorough financial analysis.",
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
    console.error("Financial Report Summarizer error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate financial report summary" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

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
    const {
      budgetType,
      totalBudget,
      categories,
      timePeriod,
      includeDetailedBreakdown,
      includeForecasting,
    } = body;
    // Budget planning works best with more capable models
    const model = getModelFromRequest(body, "openai/gpt-4o");

    const prompt = `You are an expert financial planner and budget consultant. Create a comprehensive budget plan based on the following information:

Budget Type: ${budgetType || "General Budget"}
Total Budget: ${totalBudget || "Budget amount"}
Categories: ${categories || "General categories"}
Time Period: ${timePeriod || "Budget period"}
Include Detailed Breakdown: ${includeDetailedBreakdown ? "Yes" : "No"}
Include Forecasting: ${includeForecasting ? "Yes" : "No"}

Please create a detailed budget plan that includes:

1. Executive Summary
   - Budget overview and objectives
   - Total budget allocation
   - Key financial priorities
   - Budget constraints and considerations

2. Budget Categories
   - Primary budget categories
   - Subcategory breakdowns
   - Percentage allocations
   - Priority rankings

3. Detailed Budget Breakdown (if requested)
   - Line-item budget details
   - Cost estimates and justifications
   - Contingency allocations
   - Cost optimization opportunities

4. Budget Allocation Strategy
   - Strategic allocation principles
   - Risk-based budgeting
   - Performance-based allocations
   - Flexibility and adaptability

5. Financial Planning
   - Cash flow projections
   - Revenue and expense forecasting
   - Budget variance analysis
   - Financial health indicators

6. Budget Monitoring Framework
   - Key performance indicators (KPIs)
   - Budget tracking methods
   - Reporting and review schedules
   - Variance analysis procedures

7. Forecasting and Projections (if requested)
   - Future budget projections
   - Growth and expansion planning
   - Market condition impacts
   - Scenario planning

8. Risk Management
   - Budget risk factors
   - Contingency planning
   - Emergency fund allocations
   - Risk mitigation strategies

9. Implementation Plan
   - Budget execution timeline
   - Resource allocation
   - Stakeholder responsibilities
   - Communication plan

10. Success Metrics
    - Budget performance indicators
    - ROI measurements
    - Efficiency metrics
    - Achievement tracking

Format your response as:

## Budget Plan: [Budget Type]

### Executive Summary
**Budget Overview**: [Brief description of the budget and its purpose]
**Total Budget**: [Total budget amount and currency]
**Key Priorities**: [Main financial priorities and objectives]
**Budget Constraints**: [Limitations and considerations]

### Budget Categories
**Primary Categories**: [Main budget categories and allocations]
**Subcategory Breakdown**: [Detailed subcategory allocations]
**Percentage Allocations**: [Budget distribution percentages]
**Priority Rankings**: [Category importance and priority levels]

### Detailed Budget Breakdown
[Line-item budget details if requested]

### Budget Allocation Strategy
**Strategic Principles**: [Core principles guiding budget allocation]
**Risk-Based Budgeting**: [How risks influence budget decisions]
**Performance-Based Allocation**: [Allocation based on performance metrics]
**Flexibility Considerations**: [Budget adaptability and adjustments]

### Financial Planning
**Cash Flow Projections**: [Expected cash flow over the budget period]
**Revenue Forecasting**: [Projected income and revenue streams]
**Expense Forecasting**: [Expected costs and expenditures]
**Financial Health Indicators**: [Key financial metrics to monitor]

### Budget Monitoring Framework
**Key Performance Indicators**: [KPIs for budget tracking]
**Tracking Methods**: [How to monitor budget performance]
**Reporting Schedule**: [Frequency and format of budget reports]
**Variance Analysis**: [How to analyze budget deviations]

### Forecasting and Projections
[Future budget projections and scenario planning if requested]

### Risk Management
**Budget Risks**: [Potential risks to budget success]
**Contingency Planning**: [Backup plans and emergency funds]
**Emergency Allocations**: [Reserve funds and safety nets]
**Risk Mitigation**: [Strategies to reduce budget risks]

### Implementation Plan
**Execution Timeline**: [When and how to implement the budget]
**Resource Allocation**: [People and tools needed for budget management]
**Stakeholder Responsibilities**: [Who is responsible for what]
**Communication Plan**: [How to communicate budget information]

### Success Metrics
**Performance Indicators**: [How to measure budget success]
**ROI Measurements**: [Return on budget investments]
**Efficiency Metrics**: [Cost efficiency and optimization measures]
**Achievement Tracking**: [How to track budget goal achievement]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert financial planner and budget consultant who creates comprehensive, practical budget plans. Focus on providing clear allocations, strategic planning, and actionable implementation guidance that helps organizations manage their finances effectively.",
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
    console.error("Budget Planner error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate budget plan" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

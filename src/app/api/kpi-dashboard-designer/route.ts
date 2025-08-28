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

    const { businessType, goals, metrics, includeDetailedDashboard, includeImplementationGuidance } = await req.json();

    const prompt = `You are an expert business intelligence consultant and dashboard designer. Create a comprehensive KPI dashboard design based on the following information:

Business Type: ${businessType || "General Business"}
Business Goals: ${goals || "General business objectives"}
Current Metrics: ${metrics || "General metrics"}
Include Detailed Dashboard: ${includeDetailedDashboard ? "Yes" : "No"}
Include Implementation Guidance: ${includeImplementationGuidance ? "Yes" : "No"}

Please create a detailed KPI dashboard design that includes:

1. Dashboard Overview
   - Dashboard purpose and objectives
   - Target audience and stakeholders
   - Key success metrics
   - Dashboard scope and boundaries

2. KPI Framework
   - Strategic KPIs aligned with business goals
   - Operational KPIs for day-to-day management
   - Leading and lagging indicators
   - KPI hierarchy and relationships

3. Dashboard Structure (if detailed dashboard requested)
   - Dashboard layout and sections
   - Widget and chart recommendations
   - Data visualization best practices
   - User interface considerations

4. Key Performance Indicators
   - Revenue and financial metrics
   - Customer and market metrics
   - Operational efficiency metrics
   - Growth and innovation metrics

5. Data Requirements
   - Data sources and integration needs
   - Data quality and governance
   - Real-time vs. batch data requirements
   - Data refresh and update schedules

6. Visualization Recommendations
   - Chart types for different metrics
   - Color coding and design principles
   - Interactive elements and drill-downs
   - Mobile and responsive considerations

7. Implementation Strategy (if implementation guidance requested)
   - Technology stack recommendations
   - Development approach and timeline
   - Resource requirements and team structure
   - Change management and training needs

8. Success Metrics
   - Dashboard adoption metrics
   - User engagement and satisfaction
   - Business impact measurement
   - ROI and value demonstration

9. Maintenance and Evolution
   - Ongoing maintenance requirements
   - Dashboard updates and enhancements
   - Performance monitoring and optimization
   - Future scalability considerations

10. Risk Management
    - Data security and privacy considerations
    - System reliability and backup strategies
    - User access and permissions
    - Compliance and regulatory requirements

Format your response as:

## KPI Dashboard Design: [Business Type] Dashboard

### Dashboard Overview
**Purpose**: [Main purpose and objectives of the dashboard]
**Target Audience**: [Primary users and stakeholders]
**Key Success Metrics**: [How dashboard success will be measured]
**Scope**: [What the dashboard will and won't cover]

### KPI Framework
**Strategic KPIs**: [High-level business performance indicators]
**Operational KPIs**: [Day-to-day operational metrics]
**Leading Indicators**: [Predictive and forward-looking metrics]
**Lagging Indicators**: [Historical and outcome-based metrics]

### Dashboard Structure
[Detailed dashboard layout and organization if requested]

### Key Performance Indicators
**Financial Metrics**: [Revenue, profit, cost, and financial health indicators]
**Customer Metrics**: [Customer acquisition, retention, satisfaction metrics]
**Operational Metrics**: [Efficiency, productivity, and process metrics]
**Growth Metrics**: [Expansion, innovation, and market metrics]

### Data Requirements
**Data Sources**: [Where data will come from]
**Data Quality**: [Data accuracy, completeness, and reliability requirements]
**Data Refresh**: [How often data should be updated]
**Integration Needs**: [Data connection and synchronization requirements]

### Visualization Recommendations
**Chart Types**: [Recommended visualizations for different metrics]
**Design Principles**: [Color schemes, layout, and visual hierarchy]
**Interactive Elements**: [Drill-downs, filters, and user interactions]
**Responsive Design**: [Mobile and multi-device considerations]

### Implementation Strategy
[Detailed implementation plan and technology recommendations if requested]

### Success Metrics
**Adoption Metrics**: [How to measure dashboard usage and adoption]
**User Engagement**: [Metrics for user satisfaction and engagement]
**Business Impact**: [How to measure business value and ROI]
**Performance Metrics**: [Dashboard performance and reliability metrics]

### Maintenance and Evolution
**Ongoing Maintenance**: [Regular maintenance and update requirements]
**Enhancement Strategy**: [How to evolve and improve the dashboard]
**Performance Optimization**: [Monitoring and optimization strategies]
**Scalability Planning**: [Future growth and expansion considerations]

### Risk Management
**Data Security**: [Security measures and data protection]
**System Reliability**: [Backup, recovery, and reliability strategies]
**Access Control**: [User permissions and access management]
**Compliance**: [Regulatory and compliance considerations]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert business intelligence consultant and dashboard designer who creates comprehensive, actionable KPI dashboard designs. Focus on providing clear structure, relevant metrics, and practical implementation guidance that helps organizations build effective performance monitoring systems.",
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
    console.error("KPI Dashboard Designer error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate KPI dashboard design" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

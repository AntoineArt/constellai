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
    const {
      businessIdea,
      industry,
      targetMarket,
      fundingNeeds,
      includeFinancialProjections,
      includeMarketAnalysis,
    } = body;

    const prompt = `You are an expert business strategist and consultant. Create a comprehensive business plan based on the following information:

Business Idea: ${businessIdea || "Business concept"}
Industry: ${industry || "General"}
Target Market: ${targetMarket || "General market"}
Funding Needs: ${fundingNeeds || "Not specified"}
Include Financial Projections: ${includeFinancialProjections ? "Yes" : "No"}
Include Market Analysis: ${includeMarketAnalysis ? "Yes" : "No"}

Please create a detailed business plan that includes:

1. Executive Summary
   - Business concept overview
   - Key value propositions
   - Financial highlights

2. Company Description
   - Business model
   - Mission and vision
   - Company structure

3. Market Analysis (if requested)
   - Industry overview
   - Target market segmentation
   - Competitive analysis
   - Market size and trends

4. Organization and Management
   - Management team structure
   - Key personnel roles
   - Advisory board

5. Service or Product Line
   - Product/service description
   - Competitive advantages
   - Future products/services

6. Marketing and Sales Strategy
   - Marketing approach
   - Sales strategy
   - Customer acquisition plan

7. Funding Requirements
   - Funding needs breakdown
   - Use of funds
   - Funding timeline

8. Financial Projections (if requested)
   - Revenue projections
   - Cost structure
   - Break-even analysis
   - Cash flow projections

9. Implementation Timeline
   - Key milestones
   - Launch strategy
   - Growth phases

10. Risk Analysis
    - Potential risks
    - Mitigation strategies
    - Contingency plans

Format your response as:

## Business Plan: [Business Name]

### Executive Summary
**Business Concept**: [Brief business description]
**Value Proposition**: [Key value propositions]
**Financial Highlights**: [Key financial metrics]

### Company Description
**Business Model**: [How the business operates]
**Mission & Vision**: [Company mission and vision]
**Company Structure**: [Organizational structure]

### Market Analysis
[Detailed market analysis if requested]

### Organization & Management
**Management Team**: [Key team members and roles]
**Organizational Structure**: [Company hierarchy]

### Service/Product Line
**Core Offerings**: [Main products/services]
**Competitive Advantages**: [Unique selling points]
**Future Development**: [Product roadmap]

### Marketing & Sales Strategy
**Marketing Approach**: [Marketing strategy]
**Sales Strategy**: [Sales approach]
**Customer Acquisition**: [Customer acquisition plan]

### Funding Requirements
**Funding Needs**: [Detailed funding breakdown]
**Use of Funds**: [How funds will be used]
**Funding Timeline**: [Funding schedule]

### Financial Projections
[Financial projections and analysis if requested]

### Implementation Timeline
**Key Milestones**: [Important milestones]
**Launch Strategy**: [Launch approach]
**Growth Phases**: [Growth timeline]

### Risk Analysis
**Potential Risks**: [Identified risks]
**Mitigation Strategies**: [Risk mitigation]
**Contingency Plans**: [Backup plans]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert business strategist and consultant who creates comprehensive, realistic, and actionable business plans. Focus on creating plans that are well-structured, financially sound, and provide clear strategic direction.",
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
    console.error("Business Plan Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate business plan" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

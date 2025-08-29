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
    const { businessType, industry, currentSituation, includeDetailedAnalysis, includeMitigationStrategies } = body;

    const prompt = `You are an expert risk management consultant and business strategist. Create a comprehensive risk assessment based on the following information:

Business Type: ${businessType || "General Business"}
Industry: ${industry || "General Industry"}
Current Situation: ${currentSituation || "General business situation"}
Include Detailed Analysis: ${includeDetailedAnalysis ? "Yes" : "No"}
Include Mitigation Strategies: ${includeMitigationStrategies ? "Yes" : "No"}

Please create a detailed risk assessment that includes:

1. Executive Summary
   - Key risk findings and priorities
   - Overall risk profile and exposure
   - Critical risk factors
   - Strategic implications

2. Risk Categories
   - Strategic risks (business model, competition, market changes)
   - Operational risks (processes, systems, people)
   - Financial risks (cash flow, credit, market volatility)
   - Compliance and regulatory risks
   - Technology and cybersecurity risks
   - Environmental and sustainability risks

3. Risk Identification
   - Specific risk factors and scenarios
   - Risk triggers and warning signs
   - Interdependencies between risks
   - Emerging and evolving risks

4. Risk Analysis (if detailed analysis requested)
   - Probability assessment for each risk
   - Impact assessment and severity levels
   - Risk scoring and prioritization
   - Risk correlation and cascading effects

5. Risk Assessment Matrix
   - High, medium, and low probability risks
   - High, medium, and low impact scenarios
   - Risk heat map and visualization
   - Priority risk ranking

6. Risk Monitoring Framework
   - Key risk indicators (KRIs)
   - Early warning systems
   - Monitoring frequency and methods
   - Reporting and escalation procedures

7. Mitigation Strategies (if requested)
   - Risk avoidance strategies
   - Risk reduction and control measures
   - Risk transfer options (insurance, partnerships)
   - Risk acceptance criteria

8. Contingency Planning
   - Emergency response procedures
   - Business continuity plans
   - Crisis management protocols
   - Recovery and restoration strategies

9. Risk Governance
   - Risk management roles and responsibilities
   - Risk oversight and reporting structure
   - Risk culture and awareness
   - Training and competency requirements

10. Implementation Roadmap
    - Risk mitigation timeline
    - Resource requirements and allocation
    - Success metrics and KPIs
    - Review and update procedures

Format your response as:

## Risk Assessment: [Business Type] in [Industry]

### Executive Summary
**Key Risk Findings**: [Main risk discoveries and priorities]
**Overall Risk Profile**: [Summary of risk exposure and profile]
**Critical Risk Factors**: [Most important risks to address]
**Strategic Implications**: [What this means for business strategy]

### Risk Categories
**Strategic Risks**: [Business model, competition, and market risks]
**Operational Risks**: [Process, system, and people-related risks]
**Financial Risks**: [Cash flow, credit, and market volatility risks]
**Compliance Risks**: [Regulatory and legal compliance risks]
**Technology Risks**: [Cybersecurity and technology-related risks]
**Environmental Risks**: [Sustainability and environmental factors]

### Risk Identification
**Specific Risk Factors**: [Detailed list of identified risks]
**Risk Triggers**: [Events or conditions that could trigger risks]
**Risk Interdependencies**: [How risks relate to and affect each other]
**Emerging Risks**: [New and evolving risk factors]

### Risk Analysis
[Detailed probability and impact analysis if requested]

### Risk Assessment Matrix
**High Probability/High Impact**: [Critical risks requiring immediate attention]
**High Probability/Low Impact**: [Risks to monitor and manage]
**Low Probability/High Impact**: [Risks requiring contingency planning]
**Low Probability/Low Impact**: [Risks to accept or transfer]

### Risk Monitoring Framework
**Key Risk Indicators**: [Metrics to track risk levels]
**Early Warning Systems**: [Signals that indicate risk escalation]
**Monitoring Frequency**: [How often to assess and review risks]
**Reporting Procedures**: [How to report and escalate risks]

### Mitigation Strategies
[Detailed risk mitigation approaches if requested]

### Contingency Planning
**Emergency Response**: [Immediate actions for risk events]
**Business Continuity**: [Plans to maintain operations during disruptions]
**Crisis Management**: [Procedures for managing crisis situations]
**Recovery Plans**: [Strategies for restoring normal operations]

### Risk Governance
**Roles and Responsibilities**: [Who is responsible for risk management]
**Oversight Structure**: [How risk management is governed]
**Risk Culture**: [Organizational approach to risk awareness]
**Training Requirements**: [Skills and knowledge needed for risk management]

### Implementation Roadmap
**Timeline**: [When to implement risk mitigation measures]
**Resource Requirements**: [People, budget, and tools needed]
**Success Metrics**: [How to measure risk management effectiveness]
**Review Process**: [How to update and improve risk management]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content: "You are an expert risk management consultant and business strategist who creates comprehensive, actionable risk assessments. Focus on providing clear risk identification, practical mitigation strategies, and structured monitoring frameworks that help organizations manage risks effectively.",
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
    console.error("Risk Assessment Tool error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate risk assessment" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

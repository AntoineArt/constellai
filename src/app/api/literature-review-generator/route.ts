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
    const { researchTopic, sources, researchQuestion, includeComprehensiveAnalysis, includeGapAnalysis } = body;

    const prompt = `You are an expert academic researcher and literature review specialist. Create a comprehensive literature review based on the following information:

Research Topic: ${researchTopic || "Research topic"}
Sources: ${sources || "Academic sources and papers"}
Research Question: ${researchQuestion || "Research question"}
Include Comprehensive Analysis: ${includeComprehensiveAnalysis ? "Yes" : "No"}
Include Gap Analysis: ${includeGapAnalysis ? "Yes" : "No"}

Please create a detailed literature review that includes:

1. Executive Summary
   - Research topic overview and scope
   - Key findings and insights
   - Research gaps and opportunities
   - Contribution to the field

2. Introduction and Background
   - Research context and significance
   - Scope and objectives
   - Methodology and approach
   - Organization of the review

3. Theoretical Framework
   - Key theories and concepts
   - Conceptual models
   - Theoretical perspectives
   - Framework integration

4. Literature Synthesis
   - Main themes and patterns
   - Key findings across studies
   - Methodological approaches
   - Results and conclusions

5. Critical Analysis (if comprehensive analysis requested)
   - Strengths and limitations
   - Methodological quality assessment
   - Bias and validity considerations
   - Reliability and generalizability

6. Research Gaps (if gap analysis requested)
   - Identified research gaps
   - Underexplored areas
   - Future research opportunities
   - Knowledge gaps and limitations

7. Methodological Review
   - Research designs and methods
   - Data collection approaches
   - Analysis techniques
   - Quality assessment criteria

8. Findings and Insights
   - Key empirical findings
   - Theoretical contributions
   - Practical implications
   - Policy recommendations

9. Future Research Directions
   - Research priorities
   - Emerging trends
   - Methodological improvements
   - Theoretical developments

10. Conclusion
    - Summary of key findings
    - Research implications
    - Limitations and constraints
    - Future directions

Format your response as:

## Literature Review: [Research Topic]

### Executive Summary
**Research Overview**: [Brief description of the research topic and scope]
**Key Findings**: [Main insights and discoveries from the literature]
**Research Gaps**: [Identified gaps and opportunities for future research]
**Field Contribution**: [How this review contributes to the field]

### Introduction and Background
**Research Context**: [Background and significance of the research topic]
**Scope and Objectives**: [What the literature review aims to achieve]
**Methodology**: [Approach to conducting the literature review]
**Organization**: [How the review is structured and organized]

### Theoretical Framework
**Key Theories**: [Main theoretical perspectives and frameworks]
**Conceptual Models**: [Important conceptual models and frameworks]
**Theoretical Perspectives**: [Different theoretical approaches in the field]
**Framework Integration**: [How theories and concepts are integrated]

### Literature Synthesis
**Main Themes**: [Primary themes and patterns across the literature]
**Key Findings**: [Important findings and results from studies]
**Methodological Approaches**: [Different research methods used]
**Results and Conclusions**: [Main conclusions from the literature]

### Critical Analysis
[Detailed critical analysis if requested]

### Research Gaps
[Comprehensive gap analysis if requested]

### Methodological Review
**Research Designs**: [Types of research designs used in the field]
**Data Collection**: [Methods of data collection and sampling]
**Analysis Techniques**: [Statistical and analytical approaches]
**Quality Assessment**: [Criteria for evaluating research quality]

### Findings and Insights
**Empirical Findings**: [Key empirical results and discoveries]
**Theoretical Contributions**: [Contributions to theory development]
**Practical Implications**: [Real-world applications and implications]
**Policy Recommendations**: [Recommendations for policy and practice]

### Future Research Directions
**Research Priorities**: [Important areas for future research]
**Emerging Trends**: [New and developing trends in the field]
**Methodological Improvements**: [Ways to improve research methods]
**Theoretical Developments**: [Areas for theoretical advancement]

### Conclusion
**Summary**: [Summary of key findings and insights]
**Implications**: [Implications for research and practice]
**Limitations**: [Limitations of the current literature]
**Future Directions**: [Recommendations for future research]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content: "You are an expert academic researcher and literature review specialist who creates comprehensive, well-structured literature reviews. Focus on providing clear synthesis, critical analysis, and actionable insights that help researchers understand the current state of knowledge in their field.",
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
    console.error("Literature Review Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate literature review" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

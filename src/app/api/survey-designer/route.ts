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
    const { surveyPurpose, targetAudience, researchObjectives, includeComprehensiveQuestions, includeAnalysisFramework } = body;

    const prompt = `You are an expert survey designer and research methodologist. Create a comprehensive survey based on the following information:

Survey Purpose: ${surveyPurpose || "Survey purpose"}
Target Audience: ${targetAudience || "Target audience"}
Research Objectives: ${researchObjectives || "Research objectives"}
Include Comprehensive Questions: ${includeComprehensiveQuestions ? "Yes" : "No"}
Include Analysis Framework: ${includeAnalysisFramework ? "Yes" : "No"}

Please create a detailed survey that includes:

1. Survey Overview
   - Survey purpose and objectives
   - Target audience description
   - Research questions and hypotheses
   - Expected outcomes and insights

2. Survey Structure
   - Survey sections and flow
   - Question sequencing and logic
   - Skip patterns and branching
   - Survey length and timing

3. Question Design
   - Question types and formats
   - Response scales and options
   - Question wording and clarity
   - Bias prevention strategies

4. Demographic Questions
   - Essential demographic variables
   - Age, gender, location, etc.
   - Professional and educational background
   - Relevant personal characteristics

5. Core Research Questions
   - Primary research questions
   - Secondary research questions
   - Exploratory questions
   - Validation questions

6. Question Types and Formats
   - Multiple choice questions
   - Likert scale questions
   - Open-ended questions
   - Ranking and rating questions

7. Survey Administration
   - Distribution methods
   - Sampling strategy
   - Response rate optimization
   - Data collection timeline

8. Analysis Framework (if requested)
   - Statistical analysis plan
   - Data processing procedures
   - Reporting and visualization
   - Quality control measures

9. Survey Validation
   - Pilot testing recommendations
   - Reliability and validity measures
   - Pre-testing procedures
   - Quality assurance steps

10. Implementation Guide
    - Survey administration steps
    - Data collection procedures
    - Response monitoring
    - Troubleshooting guidelines

Format your response as:

## Survey Design: [Survey Purpose]

### Survey Overview
**Purpose**: [Clear statement of survey purpose and objectives]
**Target Audience**: [Detailed description of the target population]
**Research Questions**: [Main research questions being addressed]
**Expected Outcomes**: [What insights and data the survey will provide]

### Survey Structure
**Sections**: [Main sections and flow of the survey]
**Question Flow**: [Logical progression of questions]
**Skip Patterns**: [Conditional logic and branching]
**Estimated Time**: [Expected completion time]

### Question Design
**Question Types**: [Types of questions used in the survey]
**Response Formats**: [Scales, options, and response formats]
**Question Wording**: [Clear, unbiased question formulation]
**Bias Prevention**: [Strategies to minimize response bias]

### Demographic Questions
**Essential Demographics**: [Core demographic variables to collect]
**Background Information**: [Professional and personal background]
**Relevant Characteristics**: [Characteristics relevant to the research]

### Core Research Questions
**Primary Questions**: [Main research questions]
**Secondary Questions**: [Supporting research questions]
**Exploratory Questions**: [Questions for additional insights]
**Validation Questions**: [Questions to validate responses]

### Question Types and Formats
**Multiple Choice**: [Multiple choice question examples]
**Likert Scales**: [Rating scale question examples]
**Open-Ended**: [Open-ended question examples]
**Ranking Questions**: [Ranking and prioritization questions]

### Survey Administration
**Distribution Method**: [How to distribute the survey]
**Sampling Strategy**: [Target population and sampling approach]
**Response Optimization**: [Strategies to maximize response rates]
**Timeline**: [Data collection schedule]

### Analysis Framework
[Detailed analysis plan if requested]

### Survey Validation
**Pilot Testing**: [Recommendations for pilot testing]
**Reliability Measures**: [Ensuring consistent responses]
**Validity Checks**: [Ensuring accurate measurement]
**Quality Assurance**: [Steps to ensure data quality]

### Implementation Guide
**Administration Steps**: [Step-by-step implementation guide]
**Data Collection**: [Procedures for collecting responses]
**Monitoring**: [How to track survey progress]
**Troubleshooting**: [Common issues and solutions]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content: "You are an expert survey designer and research methodologist who creates comprehensive, well-structured surveys. Focus on providing clear question design, proper methodology, and actionable insights that help researchers collect high-quality data for their studies.",
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
    console.error("Survey Designer error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate survey design" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

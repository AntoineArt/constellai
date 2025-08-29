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

    process.env.AI_GATEWAY_API_KEY = apiKey;

    const body = await req.json();
    const model = getModelFromRequest(body);
    const { dataDescription, analysisResults, statisticalTests, includePlainLanguageExplanation, includeRecommendations } = body;

    const prompt = `You are an expert data analyst and statistical consultant. Interpret data analysis results based on:

Data Description: ${dataDescription || "Data description"}
Analysis Results: ${analysisResults || "Analysis results"}
Statistical Tests: ${statisticalTests || "Statistical tests"}
Include Plain Language Explanation: ${includePlainLanguageExplanation ? "Yes" : "No"}
Include Recommendations: ${includeRecommendations ? "Yes" : "No"}

Create a comprehensive data interpretation including:

## Data Analysis Interpretation

### Executive Summary
**Key Findings**: [Main insights from the data analysis]
**Statistical Significance**: [Whether results are statistically significant]
**Practical Significance**: [Real-world implications of findings]

### Data Overview
**Dataset Description**: [Description of the data analyzed]
**Sample Size**: [Number of observations and participants]
**Variables**: [Key variables and their definitions]

### Statistical Analysis Results
**Test Results**: [Results of statistical tests performed]
**Effect Sizes**: [Magnitude of relationships or differences]
**Confidence Intervals**: [Uncertainty ranges for estimates]

### Plain Language Explanation
[Simple explanation of findings if requested]

### Key Insights
**Patterns Identified**: [Important patterns in the data]
**Relationships Found**: [Correlations and associations]
**Differences Observed**: [Significant differences between groups]

### Limitations and Considerations
**Methodological Limitations**: [Limitations of the analysis approach]
**Data Quality Issues**: [Potential data quality concerns]
**Generalizability**: [How well results apply to broader populations]

### Recommendations
[Actionable recommendations if requested]

### Next Steps
**Further Analysis**: [Suggestions for additional analysis]
**Data Collection**: [Recommendations for future data collection]
**Implementation**: [How to apply findings in practice]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content: "You are an expert data analyst and statistical consultant who explains complex statistical analyses in clear, understandable language. Focus on providing accurate interpretations, practical insights, and actionable recommendations.",
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
    console.error("Data Analysis Interpreter error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to interpret data analysis" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

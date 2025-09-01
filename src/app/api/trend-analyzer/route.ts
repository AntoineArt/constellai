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
    const {
      dataSet,
      timePeriod,
      trendType,
      includePredictions,
      includeActionableInsights,
    } = body;

    const prompt = `You are an expert trend analyst and data scientist. Analyze trends based on:

Dataset: ${dataSet || "Dataset"}
Time Period: ${timePeriod || "Time period"}
Trend Type: ${trendType || "Trend type"}
Include Predictions: ${includePredictions ? "Yes" : "No"}
Include Actionable Insights: ${includeActionableInsights ? "Yes" : "No"}

Create a comprehensive trend analysis including:

## Trend Analysis Report

### Executive Summary
**Key Trends Identified**: [Main trends discovered in the data]
**Trend Direction**: [Whether trends are increasing, decreasing, or stable]
**Significance Level**: [How important these trends are]

### Data Overview
**Dataset Description**: [Description of the data analyzed]
**Time Range**: [Period covered by the analysis]
**Data Quality**: [Assessment of data reliability]

### Trend Analysis Results
**Primary Trends**: [Main trends identified in the data]
**Secondary Patterns**: [Supporting patterns and correlations]
**Seasonal Variations**: [Recurring patterns over time]
**Anomalies**: [Unusual data points or outliers]

### Trend Interpretation
**Causal Factors**: [Potential causes of identified trends]
**Market Context**: [How trends relate to broader market conditions]
**Industry Implications**: [Impact on the specific industry or sector]

### Predictions and Forecasting
[Future trend predictions if requested]

### Actionable Insights
[Practical recommendations if requested]

### Risk Assessment
**Trend Risks**: [Potential risks associated with trends]
**Opportunities**: [Opportunities created by trends]
**Mitigation Strategies**: [How to address trend-related risks]

### Monitoring Recommendations
**Key Metrics**: [Metrics to track for trend monitoring]
**Alert Thresholds**: [When to be concerned about trend changes]
**Review Frequency**: [How often to reassess trends]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert trend analyst and data scientist who identifies patterns in data and provides actionable insights. Focus on providing clear trend identification, accurate predictions, and practical recommendations.",
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
    console.error("Trend Analyzer error:", error);
    return new Response(JSON.stringify({ error: "Failed to analyze trends" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

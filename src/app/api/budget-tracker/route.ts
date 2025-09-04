import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getApiKeyFromHeaders, getModelFromRequest } from "@/lib/ai-config";

export const maxDuration = 30;

const openai = createOpenAI({
  baseURL: "https://gateway.ai.cloudflare.com/v1/ACCOUNT_TAG/GATEWAY/openai",
});

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
    const { income, fixedExpenses, variableExpenses, goals, timeframe, currentSavings, debts } = body;

    const model = getModelFromRequest(body);

    const result = streamText({
      model: openai(model),
      messages: [
        {
          role: "system",
          content: `You are a personal finance expert and budgeting specialist who helps people create practical, sustainable budget tracking systems and achieve their financial goals.

Create comprehensive budget tracking systems that:
- Analyze income and expense patterns
- Categorize expenses effectively
- Set realistic spending limits by category
- Include emergency fund recommendations
- Provide debt payoff strategies
- Suggest money-saving opportunities
- Include goal-based saving plans
- Recommend tracking methods and tools
- Provide monthly and weekly breakdowns
- Include financial health assessments

Format responses with clear budget categories, recommended amounts, tracking methods, and actionable advice.`,
        },
        {
          role: "user",
          content: `Please create a comprehensive personal budget tracking system based on:

**Monthly Income:** ${income}
**Fixed Expenses:** ${fixedExpenses}
**Variable Expenses:** ${variableExpenses}
**Financial Goals:** ${goals}
**Timeframe:** ${timeframe}
**Current Savings:** ${currentSavings}
${debts ? `**Current Debts:** ${debts}` : ''}

Please provide a detailed budget plan with expense categories, recommended amounts, tracking strategies, and tips for achieving financial goals.`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in budget-tracker:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate budget tracking system" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
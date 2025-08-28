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

    const { description, databaseType, schema } = await req.json();

    const prompt = `You are an expert SQL developer. Generate a SQL query based on the following description:

Description: ${description}
Database Type: ${databaseType || "PostgreSQL"}
${schema ? `Schema: ${schema}` : ""}

Please provide:
1. A well-structured SQL query
2. Brief explanation of what the query does
3. Optimization suggestions if applicable
4. Any potential performance considerations

Format your response as:
## SQL Query
\`\`\`sql
[your query here]
\`\`\`

## Explanation
[explanation here]

## Optimization Suggestions
[optimization tips here]

## Performance Notes
[performance considerations here]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert SQL developer who writes clean, efficient, and well-documented SQL queries. Always provide practical optimization suggestions and explain your reasoning.",
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
    console.error("SQL Generator API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate SQL query" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

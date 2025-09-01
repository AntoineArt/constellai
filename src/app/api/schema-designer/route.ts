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
    const { requirements, databaseType, includeIndexes, includeRelationships } =
      body;

    const prompt = `You are an expert database designer. Create a comprehensive database schema based on the following requirements:

Requirements: ${requirements}
Database Type: ${databaseType || "PostgreSQL"}
Include Indexes: ${includeIndexes ? "Yes" : "No"}
Include Relationships: ${includeRelationships ? "Yes" : "No"}

Please provide:
1. Complete database schema with tables, columns, and data types
2. Primary and foreign key relationships
3. Indexes for performance optimization (if requested)
4. Constraints and validation rules
5. Sample data structure
6. Normalization considerations
7. Performance recommendations

Format your response as:
## Database Schema
\`\`\`sql
[your schema here]
\`\`\`

## Table Relationships
[relationship diagram or description]

## Indexes and Performance
[indexes and optimization notes]

## Design Considerations
[normalization, constraints, and best practices]

## Sample Data Structure
[example of how data would be structured]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert database architect who designs efficient, normalized, and scalable database schemas. Always consider performance, data integrity, and best practices for the specified database type.",
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
    console.error("Schema Designer error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate database schema" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

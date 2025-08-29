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
    const { code, description, format, framework } = body;

    const prompt = `You are an expert API documentation generator. Create comprehensive API documentation based on the following input:

${code ? `Code/Implementation: ${code}` : ""}
${description ? `Description: ${description}` : ""}
Format: ${format || "OpenAPI 3.0"}
Framework: ${framework || "Generic"}

Please generate:
1. Complete OpenAPI/Swagger specification
2. Detailed endpoint documentation
3. Request/response schemas
4. Authentication information if applicable
5. Example requests and responses
6. Error handling documentation

Format your response as:
## OpenAPI Specification
\`\`\`yaml
[your OpenAPI spec here]
\`\`\`

## Documentation Notes
[additional documentation notes here]

## Usage Examples
[example requests and responses here]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content: "You are an expert API documentation specialist who creates comprehensive, accurate, and well-structured OpenAPI/Swagger documentation. Always include proper schemas, examples, and error handling.",
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
    console.error("API Docs Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate API documentation" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

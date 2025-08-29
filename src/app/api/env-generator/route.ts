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
    const { description, framework, includeExamples, includeValidation } = body;

    const prompt = `You are an expert environment configuration generator. Create a comprehensive .env template based on the following requirements:

Description: ${description}
Framework: ${framework || "Generic"}
Include Examples: ${includeExamples ? "Yes" : "No"}
Include Validation: ${includeValidation ? "Yes" : "No"}

Please provide:
1. Complete .env template with all necessary environment variables
2. Detailed documentation for each variable
3. Example values where appropriate
4. Validation rules and requirements
5. Security considerations
6. Best practices for environment management

Format your response as:
## Environment Variables Template
\`\`\`env
[your .env template here]
\`\`\`

## Variable Documentation
[detailed explanation of each variable]

## Example Configuration
[example values and usage]

## Security Notes
[security considerations and best practices]

## Validation Rules
[validation requirements and constraints]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content: "You are an expert DevOps engineer who creates secure, well-documented environment configurations. Always consider security best practices, validation requirements, and provide clear documentation.",
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
    console.error("Env Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate environment configuration" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

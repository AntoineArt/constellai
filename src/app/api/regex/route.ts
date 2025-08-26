import { generateText } from "ai";
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

    const { description } = await req.json();

    const { text } = await generateText({
      model: "openai/gpt-4o",
      system: `You are a regex expert. Generate regular expressions based on natural language descriptions.
      
      Always respond with a JSON object containing:
      {
        "javascript": "the regex pattern with JavaScript flags (e.g., /pattern/flags)",
        "pcre": "the PCRE pattern without delimiters",
        "explanation": "a clear explanation of how the pattern works"
      }
      
      Make sure the regex is accurate and well-explained.`,
      prompt: `Generate a regular expression for: ${description}`,
    });

    try {
      const result = JSON.parse(text);
      return Response.json(result);
    } catch (parseError) {
      // Fallback if AI doesn't return valid JSON
      return Response.json({
        javascript: "/pattern/g",
        pcre: "pattern",
        explanation:
          "Unable to generate regex from the description. Please try a more specific description.",
      });
    }
  } catch (error) {
    console.error("Regex API error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate regex" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

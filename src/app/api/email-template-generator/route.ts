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

    const { purpose, tone, recipient, keyPoints, includeSignature, format } = await req.json();

    const prompt = `You are an expert email writer and communication specialist. Create a professional email template based on the following requirements:

Email Purpose: ${purpose || "General communication"}
Tone: ${tone || "Professional"}
Recipient: ${recipient || "General audience"}
Key Points: ${keyPoints || "No specific points provided"}
Include Signature: ${includeSignature ? "Yes" : "No"}
Format: ${format || "HTML"}

Please create a comprehensive email template that includes:
1. Professional subject line
2. Appropriate greeting
3. Clear and concise body content
4. Professional closing
5. Signature block (if requested)
6. Call-to-action if appropriate
7. Follow-up suggestions

Format your response as:
## Email Template
[your complete email template here]

## Subject Line Suggestions
[alternative subject lines]

## Key Elements
[breakdown of the email structure and key components]

## Follow-up Recommendations
[suggestions for follow-up actions or communications]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert email communication specialist who creates professional, effective, and engaging email templates. Focus on clarity, professionalism, and achieving the intended communication goals.",
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
    console.error("Email Template Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate email template" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

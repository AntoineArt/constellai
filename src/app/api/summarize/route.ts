import { generateText } from "ai";
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
    const { text: inputText, summaryType } = body;
    const model = getModelFromRequest(body);

    let systemPrompt = "";

    switch (summaryType) {
      case "brief":
        systemPrompt =
          "You are a professional summarizer. Create a brief, concise summary in 2-3 sentences that captures the main points.";
        break;
      case "detailed":
        systemPrompt =
          "You are a professional summarizer. Create a detailed summary with key points, supporting details, and important insights. Use clear headings and bullet points where appropriate.";
        break;
      case "bullet-points":
        systemPrompt =
          "You are a professional summarizer. Create a summary in bullet point format, highlighting the key points and important information.";
        break;
      case "executive":
        systemPrompt =
          "You are a business analyst. Create an executive summary with strategic insights, key takeaways, and actionable recommendations. Include sections for Overview, Strategic Insights, Recommendations, and Impact.";
        break;
      default:
        systemPrompt =
          "You are a professional summarizer. Create a clear and concise summary of the provided text.";
    }

    const { text: summary } = await generateText({
      model,
      system: systemPrompt,
      prompt: `Please summarize the following text:\n\n${inputText}`,
      temperature: 0.3,
    });

    return Response.json({ summary });
  } catch (error) {
    console.error("Summarize API error:", error);
    return new Response(JSON.stringify({ error: "Failed to summarize text" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

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
    const { headline, company, announcement, keyPoints, targetMedia, includeQuotes, includeBoilerplate } = body;

    const prompt = `You are an expert public relations specialist and press release writer. Create a professional press release based on the following information:

Headline: ${headline || "Company announcement"}
Company: ${company || "Company name"}
Announcement: ${announcement || "General announcement"}
Key Points: ${keyPoints || "No specific points provided"}
Target Media: ${targetMedia || "General media"}
Include Quotes: ${includeQuotes ? "Yes" : "No"}
Include Boilerplate: ${includeBoilerplate ? "Yes" : "No"}

Please create a professional press release that includes:
1. Compelling headline that captures attention
2. Strong lead paragraph with the 5 W's (Who, What, When, Where, Why)
3. Supporting paragraphs with key details and context
4. Relevant quotes from company representatives (if requested)
5. Company boilerplate information (if requested)
6. Contact information for media inquiries
7. Professional formatting and structure
8. SEO-friendly content for online distribution

Format your response as:
## Press Release
[your complete press release here]

## Media Contact Information
[contact details for journalists]

## Distribution Recommendations
[suggestions for media outreach and distribution]

## SEO Notes
[optimization tips for online press releases]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content: "You are an expert public relations specialist who writes compelling, newsworthy press releases that follow journalistic standards and capture media attention. Focus on creating clear, engaging content that tells a compelling story.",
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
    console.error("Press Release Writer error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate press release" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

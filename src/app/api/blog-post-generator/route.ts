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
    const {
      topic,
      targetAudience,
      tone,
      wordCount,
      includeSEO,
      includeOutline,
    } = body;

    const prompt = `You are an expert content writer and SEO specialist. Create a comprehensive, SEO-optimized blog post based on the following requirements:

Topic: ${topic || "General topic"}
Target Audience: ${targetAudience || "General audience"}
Tone: ${tone || "Professional"}
Word Count: ${wordCount || "1000-1500 words"}
Include SEO Elements: ${includeSEO ? "Yes" : "No"}
Include Outline: ${includeOutline ? "Yes" : "No"}

Please create a high-quality blog post that includes:
1. SEO-optimized title and meta description
2. Engaging introduction that hooks the reader
3. Well-structured content with clear headings
4. Relevant keywords and internal linking suggestions
5. Compelling conclusion with call-to-action
6. SEO recommendations and best practices
7. Content outline (if requested)

Format your response as:
## Blog Post Title
[SEO-optimized title]

## Meta Description
[SEO meta description]

## Content Outline
[structured outline if requested]

## Blog Post Content
[your complete blog post here]

## SEO Recommendations
[keyword suggestions, internal linking, and optimization tips]

## Content Strategy Notes
[additional recommendations for content marketing]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert content writer and SEO specialist who creates engaging, well-researched, and SEO-optimized blog posts. Focus on providing value to readers while incorporating best practices for search engine optimization.",
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
    console.error("Blog Post Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate blog post" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

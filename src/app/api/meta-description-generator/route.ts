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
    const { pageTitle, content, targetKeywords, targetAudience, callToAction, includeKeywords, length } = body;

    const prompt = `You are an expert SEO specialist and copywriter. Create compelling meta descriptions based on the following information:

Page Title: ${pageTitle || "Page title"}
Content: ${content || "Page content"}
Target Keywords: ${targetKeywords || "No specific keywords"}
Target Audience: ${targetAudience || "General audience"}
Call to Action: ${callToAction || "No specific CTA"}
Include Keywords: ${includeKeywords ? "Yes" : "No"}
Length: ${length || "Standard (150-160 characters)"}

Please create SEO-optimized meta descriptions that include:
1. Primary Meta Description (optimal length)
2. Alternative Versions (different approaches)
3. Long-form Meta Description (if requested)
4. Short-form Meta Description (if requested)
5. Keyword Analysis and Integration
6. Call-to-Action Optimization
7. Click-through Rate Optimization Tips

Format your response as:
## Meta Description Generator Results

### Primary Meta Description
[your optimal meta description]

### Alternative Versions
1. [alternative version 1]
2. [alternative version 2]
3. [alternative version 3]

### Long-form Meta Description
[longer version if requested]

### Short-form Meta Description
[shorter version if requested]

### Keyword Analysis
[analysis of keyword integration and optimization]

### SEO Best Practices Applied
[SEO techniques and best practices used]

### Click-through Rate Optimization
[tips for improving CTR and engagement]

### Implementation Notes
[technical implementation and character count details]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content: "You are an expert SEO specialist who creates compelling, keyword-optimized meta descriptions that improve search engine rankings and drive click-through rates. Focus on creating descriptions that accurately represent the content while being engaging and action-oriented.",
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
    console.error("Meta Description Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate meta descriptions" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

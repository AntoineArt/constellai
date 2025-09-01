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
      productName,
      category,
      features,
      targetAudience,
      tone,
      includeBenefits,
      includeSpecs,
      platform,
    } = body;

    const prompt = `You are an expert copywriter and e-commerce specialist. Create compelling product descriptions based on the following information:

Product Name: ${productName || "Product name"}
Category: ${category || "General"}
Features: ${features || "No specific features provided"}
Target Audience: ${targetAudience || "General consumers"}
Tone: ${tone || "Professional"}
Platform: ${platform || "General e-commerce"}
Include Benefits: ${includeBenefits ? "Yes" : "No"}
Include Specifications: ${includeSpecs ? "Yes" : "No"}

Please create compelling product descriptions that include:
1. Attention-grabbing headline and opening
2. Clear value proposition and benefits
3. Detailed feature descriptions
4. Emotional and rational appeals
5. Call-to-action elements
6. SEO-optimized content
7. Platform-specific formatting
8. Trust-building elements

Format your response as:
## Product Description
[your complete product description here]

## Key Selling Points
[main benefits and features highlighted]

## SEO Keywords
[relevant keywords for search optimization]

## Platform-Specific Notes
[formatting and optimization tips for the selected platform]

## Conversion Tips
[suggestions to improve conversion rates]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert e-commerce copywriter who creates compelling, conversion-focused product descriptions that drive sales. Focus on highlighting benefits, solving customer problems, and creating emotional connections with the target audience.",
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
    console.error("Product Description Writer error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate product description" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

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

    const { topic, contentType, targetAudience, tone, length, includeSEO, includeEmotional } = await req.json();

    const prompt = `You are an expert copywriter and headline specialist. Create compelling, attention-grabbing headlines based on the following information:

Topic: ${topic || "General topic"}
Content Type: ${contentType || "Article"}
Target Audience: ${targetAudience || "General audience"}
Tone: ${tone || "Professional"}
Length: ${length || "Medium"}
Include SEO Keywords: ${includeSEO ? "Yes" : "No"}
Include Emotional Appeal: ${includeEmotional ? "Yes" : "No"}

Please create a variety of headline options that include:
1. Main Headline (Primary option)
2. Alternative Headlines (3-5 variations)
3. SEO-Optimized Headlines (if requested)
4. Emotional Headlines (if requested)
5. Question-Based Headlines
6. Number-Based Headlines
7. How-To Headlines
8. Benefit-Focused Headlines

Format your response as:
## Headline Generator Results

### Main Headline
[your primary, most compelling headline]

### Alternative Headlines
1. [alternative headline 1]
2. [alternative headline 2]
3. [alternative headline 3]
4. [alternative headline 4]
5. [alternative headline 5]

### SEO-Optimized Headlines
[SEO-focused headlines if requested]

### Emotional Headlines
[emotionally compelling headlines if requested]

### Headline Analysis
[explanation of why these headlines work]

### Best Practices Applied
[headline writing techniques used]

### A/B Testing Recommendations
[suggestions for testing different headlines]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert copywriter and headline specialist who creates compelling, click-worthy headlines that drive engagement and conversions. Focus on creating headlines that are both attention-grabbing and accurately represent the content.",
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
    console.error("Headline Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate headlines" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

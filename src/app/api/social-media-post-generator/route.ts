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
    const { topic, platform, tone, includeHashtags, includeCallToAction, targetAudience } = body;

    const prompt = `You are an expert social media content creator and digital marketing specialist. Create engaging social media posts based on the following requirements:

Topic: ${topic || "General content"}
Platform: ${platform || "Instagram"}
Tone: ${tone || "Professional"}
Target Audience: ${targetAudience || "General audience"}
Include Hashtags: ${includeHashtags ? "Yes" : "No"}
Include Call to Action: ${includeCallToAction ? "Yes" : "No"}

Please create compelling social media content that includes:
1. Engaging headline or hook
2. Captivating body content
3. Relevant hashtags (if requested)
4. Call-to-action (if requested)
5. Platform-specific optimizations
6. Engagement strategies
7. Visual content suggestions

Format your response as:
## Social Media Post
[your complete post content here]

## Hashtag Suggestions
[relevant hashtags for the topic and platform]

## Engagement Tips
[strategies to increase engagement]

## Visual Content Ideas
[suggestions for images, videos, or graphics]

## Platform-Specific Optimizations
[best practices for the selected platform]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content: "You are an expert social media strategist who creates engaging, platform-optimized content that drives engagement and achieves marketing goals. Focus on creating authentic, valuable content that resonates with the target audience.",
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
    console.error("Social Media Post Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate social media post" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

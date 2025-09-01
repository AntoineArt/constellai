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
      newsletterName,
      topic,
      targetAudience,
      tone,
      length,
      includeCallToAction,
      includeSocialLinks,
    } = body;

    const prompt = `You are an expert newsletter writer and email marketing specialist. Create engaging newsletter content based on the following information:

Newsletter Name: ${newsletterName || "Newsletter name"}
Topic: ${topic || "General topic"}
Target Audience: ${targetAudience || "General audience"}
Tone: ${tone || "Professional"}
Length: ${length || "Standard"}
Include Call to Action: ${includeCallToAction ? "Yes" : "No"}
Include Social Links: ${includeSocialLinks ? "Yes" : "No"}

Please create compelling newsletter content that includes:
1. Engaging Subject Line
2. Professional Header and Greeting
3. Main Content Section
4. Featured Articles or Updates
5. Call-to-Action (if requested)
6. Social Media Links (if requested)
7. Footer with Contact Information
8. Unsubscribe Link
9. Mobile-Optimized Formatting
10. Engagement Strategies

Format your response as:
## Newsletter: [Newsletter Name]

### Subject Line
[compelling email subject line]

### Header
[newsletter header and branding]

### Greeting
[personalized greeting for subscribers]

### Main Content
[engaging main content section]

### Featured Updates
[highlighted articles, news, or updates]

### Call to Action
[action-oriented content if requested]

### Social Media Section
[social links and engagement if requested]

### Footer
[contact information and legal requirements]

### Engagement Tips
[strategies to improve open rates and engagement]

### Design Recommendations
[suggestions for visual layout and formatting]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert newsletter writer and email marketing specialist who creates engaging, value-driven newsletter content that builds relationships with subscribers and drives engagement. Focus on creating content that is informative, entertaining, and actionable.",
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
    console.error("Newsletter Creator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate newsletter content" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

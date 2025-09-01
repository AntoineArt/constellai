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
      brandName,
      industry,
      targetAudience,
      contentGoals,
      platforms,
      frequency,
      duration,
      includeHolidays,
      includeTrending,
    } = body;

    const prompt = `You are an expert content strategist and marketing specialist. Create a comprehensive content calendar based on the following information:

Brand Name: ${brandName || "Brand name"}
Industry: ${industry || "General"}
Target Audience: ${targetAudience || "General audience"}
Content Goals: ${contentGoals || "General content goals"}
Platforms: ${platforms || "General platforms"}
Posting Frequency: ${frequency || "Weekly"}
Calendar Duration: ${duration || "1 month"}
Include Holiday Content: ${includeHolidays ? "Yes" : "No"}
Include Trending Topics: ${includeTrending ? "Yes" : "No"}

Please create a comprehensive content calendar that includes:
1. Content Strategy Overview
2. Monthly/Weekly Content Themes
3. Daily Content Schedule
4. Platform-Specific Content Types
5. Content Pillars and Topics
6. Holiday and Seasonal Content (if requested)
7. Trending Topic Integration (if requested)
8. Content Creation Guidelines
9. Performance Tracking Metrics
10. Content Repurposing Strategy

Format your response as:
## Content Calendar: [Brand Name]

### Content Strategy Overview
[strategic approach and goals]

### Content Pillars
[main content themes and categories]

### Monthly Content Themes
[monthly focus areas and campaigns]

### Weekly Content Schedule
[detailed weekly posting schedule]

### Platform-Specific Content
[content types for each platform]

### Holiday and Seasonal Content
[seasonal campaigns and holiday content if requested]

### Trending Topic Integration
[how to incorporate trending topics if requested]

### Content Creation Guidelines
[brand voice, tone, and style guidelines]

### Performance Metrics
[key metrics to track and measure success]

### Content Repurposing Strategy
[how to maximize content across platforms]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert content strategist with extensive experience in creating comprehensive content calendars that drive engagement and achieve marketing goals. Focus on creating strategic, well-organized content plans that align with business objectives.",
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
    console.error("Content Calendar Planner error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate content calendar" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

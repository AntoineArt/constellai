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

    const { scriptType, topic, targetAudience, duration, tone, includeVisualCues, includeTiming } = await req.json();

    const prompt = `You are an expert script writer and content creator. Create professional scripts based on the following information:

Script Type: ${scriptType || "Video"}
Topic: ${topic || "General topic"}
Target Audience: ${targetAudience || "General audience"}
Duration: ${duration || "5 minutes"}
Tone: ${tone || "Professional"}
Include Visual Cues: ${includeVisualCues ? "Yes" : "No"}
Include Timing: ${includeTiming ? "Yes" : "No"}

Please create a comprehensive script that includes:
1. Opening Hook and Introduction
2. Main Content Sections
3. Transitions and Flow
4. Call-to-Action or Conclusion
5. Visual Cues and Directions (if requested)
6. Timing and Pacing (if requested)
7. Speaker Notes and Delivery Tips
8. Engagement Strategies
9. Technical Considerations
10. Production Notes

Format your response as:
## Script: [Topic]

### Opening (0:00 - [time])
[engaging opening and hook]

### Introduction ([time] - [time])
[introduction and topic overview]

### Main Content
#### Section 1: [title] ([time] - [time])
[main content with visual cues if requested]

#### Section 2: [title] ([time] - [time])
[continued content with transitions]

#### Section 3: [title] ([time] - [time])
[additional content and examples]

### Conclusion ([time] - [time])
[summary and call-to-action]

### Visual Cues and Directions
[visual elements and production notes if requested]

### Speaker Notes
[delivery tips and presentation guidance]

### Technical Considerations
[audio, video, and production requirements]

### Engagement Strategies
[ways to maintain audience attention and interaction]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert script writer with extensive experience in creating engaging, well-structured scripts for various media formats. Focus on creating scripts that are clear, engaging, and optimized for the target medium and audience.",
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
    console.error("Script Writer error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate script" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

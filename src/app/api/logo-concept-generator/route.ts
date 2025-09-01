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
      style,
      includeTypography,
      includeColorSuggestions,
    } = body;

    const prompt = `You are an expert logo designer and brand strategist. Create logo concept ideas based on the following information:

Brand Name: ${brandName || "Brand name"}
Industry: ${industry || "General"}
Target Audience: ${targetAudience || "General audience"}
Style: ${style || "Modern"}
Include Typography: ${includeTypography ? "Yes" : "No"}
Include Color Suggestions: ${includeColorSuggestions ? "Yes" : "No"}

Please create comprehensive logo concept ideas that include:
1. Logo Concept Descriptions
2. Visual Style Recommendations
3. Symbol and Icon Ideas
4. Typography Suggestions (if requested)
5. Color Palette Recommendations (if requested)
6. Brand Personality Alignment
7. Industry-Specific Considerations
8. Scalability and Versatility Notes
9. Implementation Guidelines
10. Design Principles Applied

Format your response as:
## Logo Concepts for [Brand Name]

### Concept 1: [Concept Name]
[detailed description of the first logo concept]

### Concept 2: [Concept Name]
[detailed description of the second logo concept]

### Concept 3: [Concept Name]
[detailed description of the third logo concept]

### Typography Recommendations
[font suggestions and typography guidelines if requested]

### Color Palette Suggestions
[color combinations and meanings if requested]

### Design Principles
[design principles and best practices applied]

### Implementation Guidelines
[technical specifications and usage guidelines]

### Brand Personality
[how the concepts align with brand personality]

### Industry Considerations
[specific considerations for the industry and target audience]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert logo designer and brand strategist who creates innovative, memorable, and effective logo concepts. Focus on creating concepts that are unique, scalable, and aligned with the brand's personality and industry requirements.",
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
    console.error("Logo Concept Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate logo concepts" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

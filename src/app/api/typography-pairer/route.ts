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
    const { projectType, brandPersonality, targetAudience, includeWebFonts, includePrintFonts } = body;

    const prompt = `You are an expert typography designer and brand strategist. Create harmonious font combinations based on the following information:

Project Type: ${projectType || "General"}
Brand Personality: ${brandPersonality || "Professional"}
Target Audience: ${targetAudience || "General audience"}
Include Web Fonts: ${includeWebFonts ? "Yes" : "No"}
Include Print Fonts: ${includePrintFonts ? "Yes" : "No"}

Please create comprehensive typography pairings that include:

1. Primary Font Combinations
   - Headline and body font pairs
   - Complementary font families
   - Hierarchy recommendations

2. Font Analysis
   - Personality and characteristics
   - Readability considerations
   - Brand alignment

3. Usage Guidelines
   - When to use each font
   - Size and weight recommendations
   - Spacing and layout tips

4. Web Font Options (if requested)
   - Google Fonts alternatives
   - Web-safe font fallbacks
   - Loading optimization tips

5. Print Font Options (if requested)
   - Print-optimized alternatives
   - Licensing considerations
   - Print production tips

6. Accessibility Considerations
   - Readability standards
   - Contrast requirements
   - Screen reader compatibility

7. Implementation Guidelines
   - CSS implementation
   - Font loading strategies
   - Performance considerations

Format your response as:

## Typography Pairings for [Project Type]

### Primary Font Combinations
**Combination 1**: [Headline Font] + [Body Font]
- **Headline**: [Font name with characteristics]
- **Body**: [Font name with characteristics]
- **Usage**: [When and how to use this combination]

**Combination 2**: [Headline Font] + [Body Font]
- **Headline**: [Font name with characteristics]
- **Body**: [Font name with characteristics]
- **Usage**: [When and how to use this combination]

### Font Analysis
**Headline Fonts**: [Analysis of headline font choices]
**Body Fonts**: [Analysis of body font choices]
**Brand Alignment**: [How fonts align with brand personality]

### Usage Guidelines
**Headlines**: [Size, weight, and spacing recommendations]
**Body Text**: [Size, weight, and spacing recommendations]
**Hierarchy**: [How to create visual hierarchy]

### Web Font Options
[Web font alternatives and implementation if requested]

### Print Font Options
[Print font alternatives and considerations if requested]

### Accessibility
[Accessibility considerations and best practices]

### Implementation
[Technical implementation guidelines]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content: "You are an expert typography designer and brand strategist who creates harmonious, readable, and brand-appropriate font combinations. Focus on creating pairings that enhance readability, maintain brand consistency, and provide clear visual hierarchy.",
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
    console.error("Typography Pairer error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate typography pairings" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

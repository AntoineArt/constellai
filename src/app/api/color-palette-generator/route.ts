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
    const { brandName, industry, mood, colorPreferences, includeAccessibility, includeColorTheory } = body;

    const prompt = `You are an expert color designer and brand strategist. Create a comprehensive color palette based on the following information:

Brand Name: ${brandName || "Brand name"}
Industry: ${industry || "General"}
Mood: ${mood || "Professional"}
Color Preferences: ${colorPreferences || "None specified"}
Include Accessibility: ${includeAccessibility ? "Yes" : "No"}
Include Color Theory: ${includeColorTheory ? "Yes" : "No"}

Please create a detailed color palette that includes:

1. Primary Color Palette
   - Main brand color with hex code
   - Primary accent color
   - Secondary accent color
   - Neutral colors

2. Extended Color Palette
   - Supporting colors
   - Background colors
   - Text colors
   - Border colors

3. Color Usage Guidelines
   - When to use each color
   - Color combinations
   - Contrast ratios

4. Accessibility Considerations (if requested)
   - WCAG compliance notes
   - High contrast alternatives
   - Colorblind-friendly considerations

5. Color Theory Explanation (if requested)
   - Color psychology
   - Industry-specific color meanings
   - Cultural considerations

6. Implementation Guidelines
   - Digital usage
   - Print considerations
   - Brand consistency tips

Format your response as:

## Color Palette for [Brand Name]

### Primary Colors
- **Main Brand Color**: [Color Name] - #HEXCODE
- **Primary Accent**: [Color Name] - #HEXCODE
- **Secondary Accent**: [Color Name] - #HEXCODE
- **Neutral**: [Color Name] - #HEXCODE

### Extended Palette
- **Supporting Color 1**: [Color Name] - #HEXCODE
- **Supporting Color 2**: [Color Name] - #HEXCODE
- **Background**: [Color Name] - #HEXCODE
- **Text Primary**: [Color Name] - #HEXCODE
- **Text Secondary**: [Color Name] - #HEXCODE

### Color Usage Guidelines
[Detailed guidelines for using each color]

### Accessibility Considerations
[WCAG compliance and accessibility notes if requested]

### Color Theory
[Color psychology and theory explanation if requested]

### Implementation Guidelines
[Technical specifications and usage tips]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content: "You are an expert color designer and brand strategist who creates harmonious, accessible, and effective color palettes. Focus on creating palettes that are visually appealing, brand-appropriate, and functional across different applications.",
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
    console.error("Color Palette Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate color palette" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

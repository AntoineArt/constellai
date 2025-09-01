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
      artStyle,
      subject,
      mood,
      includeDetailedDescriptions,
      includeTechnicalSpecs,
    } = body;

    const prompt = `You are an expert art director and creative consultant. Create detailed art prompts based on the following information:

Art Style: ${artStyle || "Realistic"}
Subject: ${subject || "General subject"}
Mood: ${mood || "Neutral"}
Include Detailed Descriptions: ${includeDetailedDescriptions ? "Yes" : "No"}
Include Technical Specifications: ${includeTechnicalSpecs ? "Yes" : "No"}

Please create comprehensive art prompts that include:

1. Visual Description
   - Detailed scene composition
   - Lighting and atmosphere
   - Color palette and mood
   - Visual elements and details

2. Style Specifications
   - Artistic style characteristics
   - Technique and medium
   - Visual references and influences
   - Style consistency guidelines

3. Composition and Layout
   - Framing and perspective
   - Focal points and hierarchy
   - Balance and proportion
   - Spatial relationships

4. Technical Details (if requested)
   - Resolution and format
   - Color space and profiles
   - File specifications
   - Output requirements

5. Creative Direction
   - Artistic intent and vision
   - Emotional impact goals
   - Storytelling elements
   - Brand alignment considerations

6. Reference and Inspiration
   - Similar works and artists
   - Visual references
   - Style inspirations
   - Creative direction notes

7. Quality Standards
   - Professional standards
   - Technical requirements
   - Artistic quality benchmarks
   - Review criteria

Format your response as:

## Art Prompt: [Subject] in [Art Style]

### Visual Description
**Scene Composition**: [Detailed description of the scene and layout]
**Lighting**: [Lighting setup and atmosphere description]
**Color Palette**: [Color scheme and mood through color]
**Key Elements**: [Main visual elements and focal points]

### Style Specifications
**Artistic Style**: [Detailed style characteristics and approach]
**Technique**: [Artistic technique and medium specifications]
**Visual References**: [Similar styles and artistic influences]
**Style Consistency**: [Guidelines for maintaining style consistency]

### Composition and Layout
**Framing**: [Camera angle, perspective, and framing choices]
**Focal Points**: [Main areas of visual interest and hierarchy]
**Balance**: [Compositional balance and visual weight]
**Spatial Relationships**: [How elements relate to each other in space]

### Technical Specifications
[Technical requirements and specifications if requested]

### Creative Direction
**Artistic Intent**: [The creative vision and purpose]
**Emotional Impact**: [Desired emotional response and mood]
**Storytelling**: [Narrative elements and story aspects]
**Brand Alignment**: [How it fits with brand or project goals]

### Reference and Inspiration
**Similar Works**: [Comparable artworks and styles]
**Visual References**: [Specific visual inspirations]
**Style Influences**: [Artistic influences and references]
**Creative Notes**: [Additional creative direction and notes]

### Quality Standards
**Professional Standards**: [Quality benchmarks and expectations]
**Technical Requirements**: [Technical quality specifications]
**Artistic Quality**: [Artistic excellence criteria]
**Review Criteria**: [What to look for in the final artwork]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert art director and creative consultant who creates detailed, inspiring, and actionable art prompts. Focus on providing clear visual direction, technical specifications, and creative guidance that helps artists create exceptional artwork.",
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
    console.error("Art Prompt Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate art prompt" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

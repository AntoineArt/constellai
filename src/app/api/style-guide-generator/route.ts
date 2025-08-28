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

    const { brandName, industry, brandPersonality, includeComprehensiveGuidelines, includeExamples } = await req.json();

    const prompt = `You are an expert brand strategist and design consultant. Create a comprehensive brand style guide based on the following information:

Brand Name: ${brandName || "Brand"}
Industry: ${industry || "General"}
Brand Personality: ${brandPersonality || "Professional"}
Include Comprehensive Guidelines: ${includeComprehensiveGuidelines ? "Yes" : "No"}
Include Examples: ${includeExamples ? "Yes" : "No"}

Please create a detailed brand style guide that includes:

1. Brand Overview
   - Brand mission and vision
   - Brand values and personality
   - Target audience definition
   - Brand positioning

2. Logo Guidelines
   - Logo usage rules
   - Clear space requirements
   - Minimum size specifications
   - Logo variations and applications

3. Color Palette
   - Primary brand colors
   - Secondary colors
   - Accent colors
   - Color usage guidelines
   - Accessibility considerations

4. Typography
   - Primary typeface
   - Secondary typeface
   - Font hierarchy
   - Typography usage rules
   - Web and print specifications

5. Imagery and Photography
   - Photography style guidelines
   - Image treatment and filters
   - Icon style and usage
   - Illustration guidelines

6. Voice and Tone
   - Brand voice characteristics
   - Tone variations
   - Writing guidelines
   - Communication principles

7. Layout and Spacing
   - Grid systems
   - Spacing standards
   - Layout principles
   - Composition guidelines

8. Digital Applications
   - Website guidelines
   - Social media standards
   - Email templates
   - Mobile applications

9. Print Applications
   - Business cards
   - Letterheads
   - Marketing materials
   - Packaging guidelines

10. Brand Assets
    - File formats and specifications
    - Asset organization
    - Naming conventions
    - Version control

Format your response as:

## Brand Style Guide: [Brand Name]

### Brand Overview
**Mission**: [Brand mission statement]
**Vision**: [Brand vision statement]
**Values**: [Core brand values]
**Personality**: [Brand personality traits]
**Target Audience**: [Primary and secondary audiences]
**Positioning**: [Brand positioning statement]

### Logo Guidelines
**Primary Logo**: [Description and usage rules]
**Clear Space**: [Minimum clear space requirements]
**Minimum Size**: [Smallest acceptable logo size]
**Logo Variations**: [Different logo formats and applications]
**Incorrect Usage**: [What not to do with the logo]

### Color Palette
**Primary Colors**: [Main brand colors with hex codes]
**Secondary Colors**: [Supporting colors with hex codes]
**Accent Colors**: [Highlight colors with hex codes]
**Color Usage**: [When and how to use each color]
**Accessibility**: [Color contrast requirements]

### Typography
**Primary Typeface**: [Main font family and usage]
**Secondary Typeface**: [Supporting font family]
**Font Hierarchy**: [Heading and body text specifications]
**Typography Rules**: [Spacing, sizing, and usage guidelines]
**Web Typography**: [Online font specifications]

### Imagery and Photography
**Photography Style**: [Photo style and aesthetic guidelines]
**Image Treatment**: [Filters, effects, and editing standards]
**Icon Style**: [Icon design and usage guidelines]
**Illustration**: [Illustration style and applications]

### Voice and Tone
**Brand Voice**: [Characteristic voice traits]
**Tone Variations**: [Different tones for different contexts]
**Writing Guidelines**: [Content and copy standards]
**Communication Principles**: [Key messaging guidelines]

### Layout and Spacing
**Grid System**: [Layout grid specifications]
**Spacing Standards**: [Margin and padding guidelines]
**Layout Principles**: [Design composition rules]
**White Space**: [Space usage guidelines]

### Digital Applications
**Website**: [Web design standards]
**Social Media**: [Social media guidelines]
**Email**: [Email template standards]
**Mobile**: [Mobile app design guidelines]

### Print Applications
**Business Cards**: [Business card specifications]
**Letterheads**: [Letterhead design standards]
**Marketing Materials**: [Brochure, flyer, and ad guidelines]
**Packaging**: [Product packaging standards]

### Brand Assets
**File Formats**: [Required file formats and specifications]
**Asset Organization**: [File naming and folder structure]
**Version Control**: [Asset versioning guidelines]
**Asset Delivery**: [How to deliver and share assets]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert brand strategist and design consultant who creates comprehensive, professional brand style guides. Focus on creating guidelines that are clear, actionable, and maintain brand consistency across all touchpoints.",
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
    console.error("Style Guide Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate style guide" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

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
      industry,
      targetAudience,
      brandPersonality,
      nameStyle,
      includeDomainCheck,
      includeTrademarkCheck,
    } = body;

    const prompt = `You are an expert brand strategist and naming specialist. Create unique and memorable brand names based on the following criteria:

Industry: ${industry || "General"}
Target Audience: ${targetAudience || "General audience"}
Brand Personality: ${brandPersonality || "Professional"}
Name Style: ${nameStyle || "Modern"}
Include Domain Check: ${includeDomainCheck ? "Yes" : "No"}
Include Trademark Check: ${includeTrademarkCheck ? "Yes" : "No"}

Please create comprehensive brand name suggestions that include:

1. Primary Brand Names
   - Creative and unique names
   - Memorable and pronounceable
   - Industry-appropriate

2. Alternative Variations
   - Different spelling options
   - Abbreviated versions
   - International variations

3. Name Analysis
   - Meaning and connotations
   - Brand personality alignment
   - Target audience appeal

4. Domain Availability Suggestions (if requested)
   - .com alternatives
   - Creative domain extensions
   - Domain naming strategies

5. Trademark Considerations (if requested)
   - Trademark search tips
   - Legal considerations
   - Registration recommendations

6. Brand Name Guidelines
   - Naming best practices
   - Avoidance of common pitfalls
   - Future scalability considerations

Format your response as:

## Brand Name Suggestions for [Industry]

### Primary Brand Names
1. **[Brand Name 1]** - [Brief description and meaning]
2. **[Brand Name 2]** - [Brief description and meaning]
3. **[Brand Name 3]** - [Brief description and meaning]
4. **[Brand Name 4]** - [Brief description and meaning]
5. **[Brand Name 5]** - [Brief description and meaning]

### Alternative Variations
- **Variation 1**: [Alternative spelling/version]
- **Variation 2**: [Alternative spelling/version]
- **Variation 3**: [Alternative spelling/version]

### Name Analysis
**Brand Name 1**: [Detailed analysis of meaning, personality fit, and audience appeal]
**Brand Name 2**: [Detailed analysis of meaning, personality fit, and audience appeal]
**Brand Name 3**: [Detailed analysis of meaning, personality fit, and audience appeal]

### Domain Availability
[Domain availability suggestions and strategies if requested]

### Trademark Considerations
[Trademark search and legal considerations if requested]

### Naming Guidelines
[Best practices and recommendations for brand naming]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert brand strategist and naming specialist who creates unique, memorable, and legally viable brand names. Focus on creating names that are distinctive, meaningful, and aligned with the brand's personality and target audience.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.4,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Brand Name Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate brand names" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

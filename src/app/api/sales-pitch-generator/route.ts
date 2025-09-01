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
      productService,
      targetAudience,
      valueProposition,
      includeDetailedPitch,
      includeObjectionHandling,
    } = body;

    const prompt = `You are an expert sales strategist and pitch consultant. Create a compelling sales pitch based on the following information:

Product/Service: ${productService || "Product or Service"}
Target Audience: ${targetAudience || "Target customers"}
Value Proposition: ${valueProposition || "Key value proposition"}
Include Detailed Pitch: ${includeDetailedPitch ? "Yes" : "No"}
Include Objection Handling: ${includeObjectionHandling ? "Yes" : "No"}

Please create a comprehensive sales pitch that includes:

1. Opening Hook
   - Attention-grabbing opening
   - Problem identification
   - Pain point amplification
   - Emotional connection

2. Problem Statement
   - Current challenges and frustrations
   - Cost of inaction
   - Market pain points
   - Customer struggles

3. Solution Presentation
   - Product/service introduction
   - Key features and benefits
   - Unique value proposition
   - Competitive advantages

4. Value Proposition
   - Clear value statement
   - ROI and benefits
   - Cost savings and efficiency gains
   - Risk mitigation

5. Proof and Credibility
   - Customer testimonials and case studies
   - Social proof and statistics
   - Industry recognition
   - Success stories

6. Call to Action
   - Clear next steps
   - Urgency and scarcity
   - Risk-free trial or guarantee
   - Contact information

7. Objection Handling (if requested)
   - Common objections and responses
   - Price objection handling
   - Competition comparison
   - Risk mitigation strategies

8. Follow-up Strategy
   - Follow-up sequence
   - Nurturing process
   - Relationship building
   - Long-term engagement

Format your response as:

## Sales Pitch: [Product/Service]

### Opening Hook
**Attention Grabber**: [Compelling opening statement]
**Problem Identification**: [Key problem your audience faces]
**Pain Point Amplification**: [Why this problem matters]
**Emotional Connection**: [How this affects their business/life]

### Problem Statement
**Current Challenges**: [Specific problems and frustrations]
**Cost of Inaction**: [What happens if they don't act]
**Market Pain Points**: [Industry-wide challenges]
**Customer Struggles**: [Real customer pain points]

### Solution Presentation
**Product/Service Introduction**: [What you're offering]
**Key Features**: [Main features and capabilities]
**Benefits**: [What customers gain]
**Unique Advantages**: [What makes you different]

### Value Proposition
**Clear Value Statement**: [Primary value proposition]
**ROI and Benefits**: [Return on investment]
**Cost Savings**: [Financial benefits]
**Risk Mitigation**: [How you reduce risk]

### Proof and Credibility
**Customer Testimonials**: [Success stories and quotes]
**Case Studies**: [Specific examples of success]
**Social Proof**: [Statistics and industry recognition]
**Success Metrics**: [Quantifiable results]

### Call to Action
**Clear Next Steps**: [What to do next]
**Urgency**: [Why act now]
**Risk-Free Offer**: [Guarantee or trial]
**Contact Information**: [How to get started]

### Objection Handling
[Common objections and responses if requested]

### Follow-up Strategy
**Follow-up Sequence**: [Post-pitch follow-up plan]
**Nurturing Process**: [Relationship building]
**Long-term Engagement**: [Ongoing value delivery]
**Success Metrics**: [How to measure success]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert sales strategist and pitch consultant who creates compelling, persuasive sales pitches. Focus on creating pitches that connect emotionally, address real pain points, and drive action through clear value propositions.",
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
    console.error("Sales Pitch Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate sales pitch" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

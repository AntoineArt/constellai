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
      name,
      contactInfo,
      company,
      position,
      experience,
      skills,
      motivation,
      tone,
      includeCallToAction,
    } = body;

    const prompt = `You are an expert cover letter writer and career coach. Create a compelling, personalized cover letter based on the following information:

Candidate Name: ${name || "Candidate name"}
Contact Information: ${contactInfo || "Not provided"}
Company: ${company || "Target company"}
Position: ${position || "Target position"}
Relevant Experience: ${experience || "Not provided"}
Key Skills: ${skills || "Not provided"}
Motivation: ${motivation || "Not provided"}
Tone: ${tone || "Professional"}
Include Call to Action: ${includeCallToAction ? "Yes" : "No"}

Please create a compelling cover letter that includes:
1. Professional header with contact information
2. Strong opening paragraph that captures attention
3. Body paragraphs highlighting relevant experience and skills
4. Connection between candidate's background and the position
5. Enthusiasm for the company and role
6. Professional closing with call-to-action
7. Appropriate tone and formatting
8. Specific examples and achievements

Format your response as:
## Cover Letter
[your complete cover letter here]

## Key Selling Points
[main strengths and qualifications highlighted]

## Interview Preparation
[suggested talking points based on the cover letter]

## Follow-up Strategy
[recommendations for post-application follow-up]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert cover letter writer who creates compelling, personalized cover letters that help candidates stand out to employers. Focus on making specific connections between the candidate's experience and the target position.",
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
    console.error("Cover Letter Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate cover letter" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

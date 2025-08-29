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
    const { name, contactInfo, summary, experience, education, skills, targetJob, format, includeKeywords } = body;

    const prompt = `You are an expert resume writer and career coach. Create a professional, tailored resume based on the following information:

Name: ${name || "Candidate name"}
Contact Information: ${contactInfo || "Not provided"}
Professional Summary: ${summary || "Not provided"}
Work Experience: ${experience || "Not provided"}
Education: ${education || "Not provided"}
Skills: ${skills || "Not provided"}
Target Job: ${targetJob || "General position"}
Format: ${format || "Professional"}
Include Keywords: ${includeKeywords ? "Yes" : "No"}

Please create a compelling resume that includes:
1. Professional header with contact information
2. Strong professional summary tailored to the target job
3. Detailed work experience with quantifiable achievements
4. Education and certifications
5. Relevant skills and competencies
6. ATS-friendly formatting and keywords
7. Industry-specific terminology
8. Action-oriented language and achievements

Format your response as:
## Professional Resume
[your complete resume here]

## ATS Optimization Notes
[keyword suggestions and formatting tips]

## Career Advice
[additional recommendations for the job search]

## Interview Preparation
[suggested talking points based on the resume]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content: "You are an expert resume writer and career coach who creates compelling, ATS-optimized resumes that help candidates stand out to employers. Focus on highlighting achievements, using action verbs, and tailoring content to the target position.",
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
    console.error("Resume Builder error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate resume" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

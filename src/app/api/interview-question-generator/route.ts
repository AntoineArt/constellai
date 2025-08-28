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

    process.env.AI_GATEWAY_API_KEY = apiKey;

    const { interviewType, position, candidateProfile, includeBehavioralQuestions, includeTechnicalQuestions } = await req.json();

    const prompt = `You are an expert interviewer and HR professional. Create comprehensive interview questions based on:

Interview Type: ${interviewType || "General Interview"}
Position: ${position || "Position"}
Candidate Profile: ${candidateProfile || "Candidate profile"}
Include Behavioral Questions: ${includeBehavioralQuestions ? "Yes" : "No"}
Include Technical Questions: ${includeTechnicalQuestions ? "Yes" : "No"}

Create a detailed interview question set including:

## Interview Questions: [Position]

### Opening Questions
**Ice Breakers**: [Warm-up questions to put candidate at ease]
**Background Questions**: [Questions about candidate's background and experience]

### Core Competency Questions
**Skills Assessment**: [Questions to evaluate relevant skills]
**Experience Validation**: [Questions about past work experience]
**Problem-Solving**: [Questions to assess analytical thinking]

### Behavioral Questions
[STAR method behavioral questions if requested]

### Technical Questions
[Technical assessment questions if requested]

### Culture Fit Questions
**Teamwork**: [Questions about collaboration and teamwork]
**Values Alignment**: [Questions about company culture fit]
**Motivation**: [Questions about career goals and motivation]

### Closing Questions
**Candidate Questions**: [Encourage candidate to ask questions]
**Next Steps**: [Information about the hiring process]

### Interview Tips
**Question Techniques**: [Best practices for conducting interviews]
**Red Flags**: [Signs to watch for during interviews]
**Scoring Guide**: [How to evaluate responses]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert interviewer and HR professional who creates comprehensive, effective interview questions. Focus on providing structured, relevant questions that help assess candidate qualifications, skills, and cultural fit.",
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
    console.error("Interview Question Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate interview questions" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

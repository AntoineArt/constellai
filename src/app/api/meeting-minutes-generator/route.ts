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

    process.env.AI_GATEWAY_API_KEY = apiKey;

    const body = await req.json();
    const model = getModelFromRequest(body);
    const {
      meetingNotes,
      meetingType,
      participants,
      duration,
      includeActionItems,
      includeDecisions,
    } = body;

    const prompt = `You are an expert meeting facilitator and documentation specialist. Generate structured meeting minutes based on:

Meeting Notes: ${meetingNotes || "Meeting notes or recording transcript"}
Meeting Type: ${meetingType || "Type of meeting"}
Participants: ${participants || "Meeting participants"}
Duration: ${duration || "Meeting duration"}
Include Action Items: ${includeActionItems ? "Yes" : "No"}
Include Decisions: ${includeDecisions ? "Yes" : "No"}

Create comprehensive meeting minutes including:

## Meeting Minutes

### Meeting Information
**Date**: [Date]
**Time**: [Time]
**Duration**: ${duration}
**Meeting Type**: ${meetingType}
**Participants**: ${participants}

### Meeting Summary
[Brief overview of the meeting purpose and outcomes]

### Agenda Items Discussed

#### 1. [Agenda Item 1]
**Discussion**: [Key points discussed]
**Outcomes**: [Results or conclusions]

#### 2. [Agenda Item 2]
**Discussion**: [Key points discussed]
**Outcomes**: [Results or conclusions]

[Continue with all agenda items...]

### Key Decisions Made
[If requested, list all decisions made during the meeting]

### Action Items
[If requested, list all action items with assignees and deadlines]

### Next Steps
[Follow-up actions and next meeting details]

### Notes
[Additional important information or context]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert meeting facilitator who creates clear, structured meeting minutes that capture key discussions, decisions, and action items. Focus on organizing information logically, highlighting important outcomes, and ensuring all participants and stakeholders have clear next steps.",
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
    console.error("Meeting Minutes Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate meeting minutes" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

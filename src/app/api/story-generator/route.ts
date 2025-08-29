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
    const { storyPrompt, genre, targetAudience, length, tone, includeCharacters, includeDialogue } = body;

    const prompt = `You are an expert storyteller and creative writer. Create engaging stories based on the following information:

Story Prompt: ${storyPrompt || "A creative story"}
Genre: ${genre || "General"}
Target Audience: ${targetAudience || "General audience"}
Length: ${length || "Short story"}
Tone: ${tone || "Engaging"}
Include Character Development: ${includeCharacters ? "Yes" : "No"}
Include Dialogue: ${includeDialogue ? "Yes" : "No"}

Please create a compelling story that includes:
1. Engaging Opening Hook
2. Well-Developed Characters (if requested)
3. Compelling Plot Development
4. Natural Dialogue (if requested)
5. Climactic Moments
6. Satisfying Conclusion
7. Vivid Descriptions
8. Emotional Resonance
9. Genre-Appropriate Elements
10. Memorable Moments

Format your response as:
## Story: [Title]

### Opening
[engaging opening that hooks the reader]

### Main Story
[well-developed plot with character development if requested]

### Dialogue and Interactions
[natural dialogue and character interactions if requested]

### Climax and Resolution
[exciting climax and satisfying conclusion]

### Story Analysis
[analysis of themes, character development, and storytelling techniques]

### Writing Tips
[suggestions for improving the story and writing techniques]

### Genre-Specific Notes
[genre conventions and elements used in the story]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content: "You are an expert storyteller and creative writer who creates engaging, well-crafted stories that captivate readers. Focus on creating stories with compelling characters, engaging plots, and emotional resonance.",
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
    console.error("Story Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate story" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

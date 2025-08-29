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
    const { sourceInfo, citationStyle, includeMultipleFormats, includeBibliography } = body;

    const prompt = `You are an expert academic citation specialist. Generate citations based on:

Source Information: ${sourceInfo || "Source information"}
Citation Style: ${citationStyle || "Citation style"}
Include Multiple Formats: ${includeMultipleFormats ? "Yes" : "No"}
Include Bibliography: ${includeBibliography ? "Yes" : "No"}

Create comprehensive citations including:

## Citation Generator Results

### Primary Citation
**${citationStyle} Format**: [Main citation in requested style]

### Alternative Formats
[Additional citation formats if requested]

### Bibliography Entry
[Bibliography format if requested]

### Citation Guidelines
**Style Rules**: [Key formatting rules for the citation style]
**Common Mistakes**: [Frequent citation errors to avoid]
**Best Practices**: [Tips for proper citation formatting]

### Source Validation
**Missing Information**: [Any missing details that should be included]
**Formatting Notes**: [Special formatting considerations]
**Style-Specific Requirements**: [Requirements specific to the citation style]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content: "You are an expert academic citation specialist who generates accurate, properly formatted citations in various academic styles. Focus on providing correct formatting, complete information, and helpful guidance for proper citation practices.",
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
    console.error("Citation Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate citations" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

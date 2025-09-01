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
    const { code, description, projectName, includeSections, format } = body;

    const prompt = `You are an expert technical writer specializing in creating comprehensive README files. Generate a professional README based on the following information:

Project Name: ${projectName || "My Project"}
Description: ${description || ""}

Code/Project Structure:
\`\`\`
${code || "No code provided"}
\`\`\`

Include Sections: ${includeSections ? includeSections.join(", ") : "All standard sections"}
Format: ${format || "Markdown"}

Please create a comprehensive README that includes:
1. Project title and description
2. Features and capabilities
3. Installation instructions
4. Usage examples
5. API documentation (if applicable)
6. Configuration options
7. Contributing guidelines
8. License information
9. Troubleshooting section
10. Changelog (if applicable)

Format your response as:
## README.md
\`\`\`markdown
[your complete README content here]
\`\`\`

## Additional Notes
[any additional recommendations or suggestions]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert technical writer who creates clear, comprehensive, and professional README files. Focus on clarity, completeness, and user-friendliness. Include all necessary sections and provide practical examples.",
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
    console.error("README Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate README" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

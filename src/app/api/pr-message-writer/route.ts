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

    const { commits, branchName, includeTesting, includeBreakingChanges } = await req.json();

    const prompt = `You are an expert technical writer specializing in creating professional pull request descriptions. Generate a comprehensive PR description based on the following commit history:

Branch Name: ${branchName || "feature-branch"}

Commit History:
\`\`\`
${commits || "No commits provided"}
\`\`\`

Include Testing Notes: ${includeTesting ? "Yes" : "No"}
Include Breaking Changes: ${includeBreakingChanges ? "Yes" : "No"}

Please create a professional PR description that includes:
1. Clear summary of changes
2. Detailed description of what was implemented
3. Testing instructions and notes (if requested)
4. Breaking changes documentation (if any)
5. Screenshots or examples (if applicable)
6. Checklist for reviewers
7. Related issues or tickets

Format your response as:
## Pull Request Description
[your complete PR description here]

## Additional Notes
[any additional recommendations or suggestions]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert technical writer who creates clear, professional, and comprehensive pull request descriptions. Focus on clarity, completeness, and providing actionable information for reviewers.",
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
    console.error("PR Message Writer error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate PR description" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

import { streamText, generateText } from "ai";

export const runtime = "edge";

export async function POST(request: Request) {
	try {
		const body = await request.json().catch(() => ({}));
		const messages = Array.isArray(body?.messages) ? body.messages : undefined;
		const prompt: string | undefined = typeof body?.prompt === "string" ? body.prompt : undefined;
		const model: string = typeof body?.model === "string" && body.model.length > 0
			? body.model
			: "anthropic/claude-3.5-sonnet";

		// For reliability, generate full text (non-stream) and return as plain text
		const { text } = await generateText({
			model,
			...(Array.isArray(messages) && messages.length > 0
				? { messages }
				: { prompt: prompt ?? "" }),
			providerOptions: {
				// Configure routing/fallbacks using Vercel AI Gateway
				// See: https://vercel.com/docs/ai-gateway/provider-options
				gateway: {
					order: ["anthropic", "openai", "groq"],
				},
				...(body?.providerOptions ?? {}),
			},
		});

		return new Response(text, { headers: { "content-type": "text/plain; charset=utf-8" } });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { "content-type": "application/json" },
		});
	}
}



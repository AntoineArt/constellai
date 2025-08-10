import { streamText, UIMessage, convertToModelMessages } from "ai";

export const runtime = "edge";

export async function POST(request: Request) {
	try {
		const body: { messages: UIMessage[]; model?: string; webSearch?: boolean } = await request.json().catch(() => ({} as any));
		const messages = Array.isArray(body?.messages) ? body.messages : [];
		const requestedModel: string = typeof body?.model === "string" && body.model.length > 0
			? body.model
			: "anthropic/claude-3.5-sonnet";
		const model = body?.webSearch ? "perplexity/sonar" : requestedModel;

		const result = streamText({
			model,
			messages: convertToModelMessages(messages),
			system: "You are a helpful assistant that can answer questions and help with tasks",
			providerOptions: {
				gateway: { order: ["anthropic", "openai", "groq"] },
			},
		});

		return result.toUIMessageStreamResponse({ sendSources: true, sendReasoning: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { "content-type": "application/json" },
		});
	}
}



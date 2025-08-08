import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

interface UiMessage {
	id: string;
	role: "user" | "assistant" | "system";
	content: string;
}

export async function POST(req: Request) {
	const { messages } = (await req.json()) as { messages: Array<UiMessage> };
	const promptLines: Array<string> = [];
	for (const m of messages) {
		const prefix = m.role === "user" ? "User" : m.role === "assistant" ? "Assistant" : "System";
		promptLines.push(`${prefix}: ${m.content}`);
	}
	const { text } = await generateText({ model: openai("gpt-4o-mini"), prompt: promptLines.join("\n") });
	return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}



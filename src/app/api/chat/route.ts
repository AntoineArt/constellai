import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function POST(req: Request) {
	const { input } = (await req.json()) as { input: string };
	const { text } = await generateText({ model: openai("gpt-4o-mini"), prompt: input });
	return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}



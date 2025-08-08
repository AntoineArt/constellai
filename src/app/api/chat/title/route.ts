import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function POST(req: Request) {
	const { content } = (await req.json()) as { content: string };
	const prompt = `Generate a short, concise conversation title (3-6 words) for this prompt. No quotes, no punctuation at end.\n\n${content}`;
	const { text } = await generateText({ model: openai("gpt-4o-mini"), prompt });
	const title = text.replaceAll("\n", " ").slice(0, 60).trim();
	return Response.json({ title });
}



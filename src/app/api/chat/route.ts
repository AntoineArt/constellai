import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function POST(req: Request) {
	const { input, attachments } = (await req.json()) as {
		input: string;
		attachments?: Array<{ kind: string; url: string; name?: string | null }>;
	};
	const attachmentNote = attachments && attachments.length
		? `\n\nAttachments:\n${attachments.map((a) => `- [${a.kind}] ${a.name ?? a.url}: ${a.url}`).join("\n")}`
		: "";
	const result = await generateText({ model: openai("gpt-4o-mini"), prompt: `${input}${attachmentNote}` });
	return Response.json({
		text: result.text,
		usage: result.usage,
		modelId: "gpt-4o-mini",
	});
}



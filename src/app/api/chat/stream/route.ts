import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
	const { input, attachments, modelId, conversationId } = (await req.json()) as {
		input: string;
		modelId: string;
		conversationId: string;
		attachments?: Array<{ kind: string; url: string; name?: string | null }>;
	};
	const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL ?? "");
	const { getToken } = await auth();
	const token = await getToken({ template: "convex" }).catch(() => null);
	if (token) client.setAuth(token);
	const allowed = await client.query(api.index.listAllowedModels, {});
	if (!allowed.includes(modelId)) return new Response("model not allowed", { status: 403 });

	const attachmentNote = attachments && attachments.length
		? `\n\nAttachments:\n${attachments.map((a) => `- [${a.kind}] ${a.name ?? a.url}: ${a.url}`).join("\n")}`
		: "";
	const result = await streamText({ model: openai(modelId), prompt: `${input}${attachmentNote}` });
	return result.toTextStreamResponse();
}



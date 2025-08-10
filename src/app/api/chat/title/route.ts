import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
	const { content, modelId } = (await req.json()) as { content: string; modelId?: string };
	const prompt = `Generate a short, concise conversation title (3-6 words) for this prompt. No quotes, no punctuation at end.\n\n${content}`;
	const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL ?? "");
	const { getToken } = await auth();
	const token = await getToken({ template: "convex" }).catch(() => null);
	if (token) client.setAuth(token);
	const allowed = await client.query(api.index.listAllowedModels, {});
	const chosenModel = modelId && allowed.includes(modelId) ? modelId : (allowed[0] ?? "gpt-4o-mini");
	const { text } = await generateText({ model: openai(chosenModel), prompt });
	const title = text.replaceAll("\n", " ").slice(0, 60).trim();
	return Response.json({ title });
}



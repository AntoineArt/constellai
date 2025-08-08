import { api } from "../../../../convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

export async function POST(req: Request) {
	const { conversationId, modelId, promptTokens, completionTokens } = (await req.json()) as {
		conversationId: string;
		modelId: string;
		promptTokens: number;
		completionTokens: number;
	};
	const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL ?? "");
	await client.mutation(api.index.reportUsageForConversation, {
		conversationId: conversationId as any,
		modelId,
		promptTokens,
		completionTokens,
	});
	return new Response("ok");
}



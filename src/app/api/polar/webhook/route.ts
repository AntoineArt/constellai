import { headers } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

export async function POST(req: Request) {
	// TODO: verify Polar signature here (left as exercise; depends on your key)
	const body = await req.json();
	const eventType = body?.type ?? "unknown";
	const clerkUserId: string | undefined = body?.data?.metadata?.clerkUserId;
	const amountUsdMicro: bigint = BigInt(Math.round((body?.data?.amount ?? 0) * 1_000_000));
	const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL ?? "");
	await client.mutation(api.index.processPolarWebhook, {
		clerkUserId,
		eventType,
		amountUsdMicro: amountUsdMicro as any,
		refId: String(body?.data?.id ?? ""),
	});
	return new Response("ok");
}



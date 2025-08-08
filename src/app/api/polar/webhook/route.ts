import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { createHmac, timingSafeEqual } from "crypto";

function verifySignature(raw: string, signature: string | null, secret: string | undefined): boolean {
	if (!secret || !signature) return false;
	const hmac = createHmac("sha256", secret);
	hmac.update(raw, "utf8");
	const digest = hmac.digest("hex");
	try {
		return timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
	} catch {
		return false;
	}
}

export async function POST(req: Request) {
	const raw = await req.text();
	const signature = req.headers.get("x-polar-signature");
	const ok = verifySignature(raw, signature, process.env.POLAR_WEBHOOK_SECRET);
	if (!ok) return new Response("invalid signature", { status: 401 });
	const body = JSON.parse(raw);
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



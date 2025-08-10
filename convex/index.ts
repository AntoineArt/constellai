import { query, mutation, internalAction, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internal, api } from "./_generated/api";
import { action } from "./_generated/server";

export const getOrCreateUser = mutation({
	args: { clerkUserId: v.string(), email: v.string() },
	returns: v.id("users"),
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
			.unique();
		if (existing) return existing._id;
		const userId = await ctx.db.insert("users", {
			clerkUserId: args.clerkUserId,
			email: args.email,
			referralCode: undefined,
			referredByCode: undefined,
		});
		await ctx.db.insert("wallets", {
			userId,
			usdMicroBalance: 0n,
			updatedAt: Date.now(),
		});
		return userId;
	},
});

export const ensureSelf = mutation({
	args: {},
	returns: v.id("users"),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthenticated");
		const existing = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
			.unique();
		if (existing) return existing._id;
		const userId = await ctx.db.insert("users", {
			clerkUserId: identity.subject,
			email: identity.email ?? "",
			referralCode: undefined,
			referredByCode: undefined,
		});
		await ctx.db.insert("wallets", { userId, usdMicroBalance: 0n, updatedAt: Date.now() });
		return userId;
	},
});

export const getSelf = query({
	args: {},
	returns: v.union(
		v.null(),
		v.object({ _id: v.id("users"), clerkUserId: v.string(), email: v.string() }),
	),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;
		const existing = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
			.unique();
		if (!existing) return null;
		return { _id: existing._id, clerkUserId: existing.clerkUserId, email: existing.email };
	},
});

export const listConversations = query({
	args: { userId: v.id("users") },
	returns: v.array(
		v.object({
			_id: v.id("conversations"),
			_creationTime: v.number(),
			userId: v.id("users"),
			title: v.optional(v.string()),
			modelId: v.string(),
			lastActivityTime: v.number(),
		}),
	),
	handler: async (ctx, args) => {
		const rows = await ctx.db
			.query("conversations")
			.withIndex("by_user_and_last_activity", (q) => q.eq("userId", args.userId))
			.order("desc")
			.take(50);
		return rows;
	},
});

export const listMyConversations = query({
	args: {},
	returns: v.array(
		v.object({
			_id: v.id("conversations"),
			_creationTime: v.number(),
			userId: v.id("users"),
			title: v.optional(v.string()),
			modelId: v.string(),
			lastActivityTime: v.number(),
		}),
	),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
			.unique();
		if (!user) return [];
		return await ctx.db
			.query("conversations")
			.withIndex("by_user_and_last_activity", (q) => q.eq("userId", user._id))
			.order("desc")
			.take(100);
	},
});

export const searchMyConversations = query({
	args: { q: v.string() },
	returns: v.array(
		v.object({
			_id: v.id("conversations"),
			_creationTime: v.number(),
			userId: v.id("users"),
			title: v.optional(v.string()),
			modelId: v.string(),
			lastActivityTime: v.number(),
		}),
	),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
			.unique();
		if (!user) return [];
		const all = await ctx.db
			.query("conversations")
			.withIndex("by_user_and_last_activity", (q) => q.eq("userId", user._id))
			.order("desc")
			.take(200);
		const q = args.q.toLowerCase();
		const results: typeof all = [];
		for (const c of all) {
			const title = (c.title ?? "").toLowerCase();
			if (title.includes(q)) {
				results.push(c);
				continue;
			}
			const msgs = await ctx.db
				.query("messages")
				.withIndex("by_conversation", (x) => x.eq("conversationId", c._id))
				.order("desc")
				.take(50);
			if (msgs.some((m) => m.content.toLowerCase().includes(q))) results.push(c);
		}
		return results;
	},
});

export const createConversation = mutation({
	args: { userId: v.id("users"), modelId: v.string(), title: v.optional(v.string()) },
	returns: v.id("conversations"),
	handler: async (ctx, args) => {
		return await ctx.db.insert("conversations", {
			userId: args.userId,
			modelId: args.modelId,
			title: args.title,
			lastActivityTime: Date.now(),
		});
	},
});

export const createMyConversation = mutation({
	args: { modelId: v.string(), title: v.optional(v.string()) },
	returns: v.id("conversations"),
	handler: async (ctx, args): Promise<Id<"conversations">> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthenticated");
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
			.unique();
		if (!user) throw new Error("User missing");
		// enforce model whitelist / limited mode
		const allowed: Array<string> = await ctx.runQuery(internal.index.getAllowedModels as any, {});
		if (!allowed.includes(args.modelId)) throw new Error("Model not allowed");
		return await ctx.db.insert("conversations", {
			userId: user._id,
			modelId: args.modelId,
			title: args.title,
			lastActivityTime: Date.now(),
		});
	},
});

export const sendMessage = mutation({
	args: {
		conversationId: v.id("conversations"),
		role: v.union(v.literal("user"), v.literal("system")),
		content: v.string(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await ctx.db.insert("messages", {
			conversationId: args.conversationId,
			role: args.role,
			content: args.content,
		});
		await ctx.db.patch(args.conversationId, { lastActivityTime: Date.now() });
		return null;
	},
});

export const sendMyMessage = mutation({
	args: {
		conversationId: v.id("conversations"),
		content: v.string(),
		attachments: v.optional(
			v.array(
				v.object({
					kind: v.string(),
					url: v.string(),
					name: v.optional(v.string()),
					size: v.optional(v.number()),
					contentType: v.optional(v.string()),
				}),
			),
		),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const messageId = await ctx.db.insert("messages", {
			conversationId: args.conversationId,
			role: "user",
			content: args.content,
			attachments: args.attachments,
		});
		// Auto-title on first user message if not set
		const existing = await ctx.db
			.query("messages")
			.withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
			.take(2);
		const conv = await ctx.db.get(args.conversationId);
		if (conv && !conv.title && existing.length <= 1) {
			const title = args.content.slice(0, 60);
			await ctx.db.patch(args.conversationId, { title });
		}
		await ctx.db.patch(args.conversationId, { lastActivityTime: Date.now() });
		return null;
	},
});

export const writeAssistantMessage = internalMutation({
	args: { conversationId: v.id("conversations"), content: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		await ctx.db.insert("messages", {
			conversationId: args.conversationId,
			role: "assistant",
			content: args.content,
		});
		await ctx.db.patch(args.conversationId, { lastActivityTime: Date.now() });
		return null;
	},
});

export const writeAssistantMessagePublic = mutation({
	args: { conversationId: v.id("conversations"), content: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		// Guard: ensure the requester owns the conversation
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthenticated");
		const conv = await ctx.db.get(args.conversationId);
		if (!conv) throw new Error("Conversation not found");
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
			.unique();
		if (!user || conv.userId !== user._id) throw new Error("Forbidden");
		await ctx.db.insert("messages", {
			conversationId: args.conversationId,
			role: "assistant",
			content: args.content,
		});
		await ctx.db.patch(args.conversationId, { lastActivityTime: Date.now() });
		return null;
	},
});

export const listMessages = query({
	args: { conversationId: v.id("conversations") },
	returns: v.array(
		v.object({
			_id: v.id("messages"),
			_creationTime: v.number(),
			conversationId: v.id("conversations"),
			role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
			content: v.string(),
			attachments: v.optional(
				v.array(
					v.object({
						kind: v.string(),
						url: v.string(),
						name: v.optional(v.string()),
						size: v.optional(v.number()),
						contentType: v.optional(v.string()),
					}),
				),
			),
		}),
	),
	handler: async (ctx, args) => {
		return await ctx.db
			.query("messages")
			.withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
			.order("asc")
			.take(500);
	},
});

export const deleteMessageIfOwner = mutation({
	args: { messageId: v.id("messages") },
	returns: v.null(),
	handler: async (ctx, args) => {
		const msg = await ctx.db.get(args.messageId);
		if (!msg) return null;
		const conv = await ctx.db.get(msg.conversationId);
		if (!conv) return null;
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthenticated");
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
			.unique();
		if (!user || conv.userId !== user._id) throw new Error("Forbidden");
		await ctx.db.delete(args.messageId);
		return null;
	},
});

export const getAllowedModels = internalQuery({
	args: {},
	returns: v.array(v.string()),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return ["gpt-4o-mini"]; // anonymous => limited
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
			.unique();
		if (!user) return ["gpt-oss-20b"]; // not provisioned yet

		const wallet = await ctx.db
			.query("wallets")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.unique();
		const limits = await ctx.db
			.query("limits")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.unique();

		const whitelist = [
			"gpt-4o-mini",
			"gpt-4o",
		];

		const balance = wallet?.usdMicroBalance ?? 0n;
		const dailyQuota = limits?.freeModeDailyUsdMicroQuota ?? 500_000n; // $0.50
		const usedToday = limits?.freeModeUsedTodayUsdMicro ?? 0n;
		if (balance <= 0n) {
			if (usedToday >= dailyQuota) return [];
			return ["gpt-4o-mini"]; // limited mode
		}
		return whitelist;
	},
});

export const renameConversation = mutation({
	args: { conversationId: v.id("conversations"), title: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const conv = await ctx.db.get(args.conversationId);
		if (!conv) throw new Error("Conversation not found");
		await ctx.db.patch(args.conversationId, { title: args.title });
		return null;
	},
});

export const deleteConversation = mutation({
	args: { conversationId: v.id("conversations") },
	returns: v.null(),
	handler: async (ctx, args) => {
		// delete messages
		const msgs = await ctx.db
			.query("messages")
			.withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
			.collect();
		for (const m of msgs) {
			await ctx.db.delete(m._id);
		}
		await ctx.db.delete(args.conversationId);
		return null;
	},
});

export const reportUsageForConversation = mutation({
	args: {
		conversationId: v.id("conversations"),
		modelId: v.string(),
		promptTokens: v.number(),
		completionTokens: v.number(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		// Ensure ownership
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthenticated");
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
			.unique();
		if (!user) throw new Error("User missing");
		const conv = await ctx.db.get(args.conversationId);
		if (!conv || conv.userId !== user._id) throw new Error("Forbidden");

		// Find latest active rate
		const rates = await ctx.db
			.query("modelRates")
			.withIndex("by_model_and_version", (q) => q.eq("modelId", args.modelId))
			.order("desc")
			.take(5);
		const rate = rates.find((r) => r.isActive) ?? rates[0];
		const inputRate = rate ? rate.inputPerMillionUsdMicro : 0n;
		const outputRate = rate ? rate.outputPerMillionUsdMicro : 0n;
		const million = 1_000_000n;
		const ceilDiv = (numerator: bigint, denominator: bigint) => (numerator + (denominator - 1n)) / denominator;
		const inputMicro = ceilDiv(BigInt(args.promptTokens) * inputRate, million);
		const outputMicro = ceilDiv(BigInt(args.completionTokens) * outputRate, million);
		const base = inputMicro + outputMicro;
		const marginPpm = 50_000n; // 5%
		const margin = ceilDiv(base * marginPpm, 1_000_000n);

		await ctx.runMutation(internal.index.logUsageEventAndDebit, {
			userId: user._id as Id<"users">,
			toolSlug: "chat",
			modelId: args.modelId,
			promptTokens: args.promptTokens,
			completionTokens: args.completionTokens,
			usdMicroCost: base,
			usdMicroMargin: margin,
			gatewayRequestId: undefined,
			rateVersion: rate ? rate.version : 0,
			status: "ok",
		});

		// Update limited-mode usage if wallet is empty
		const wallet = await ctx.db
			.query("wallets")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.unique();
		if (!wallet || wallet.usdMicroBalance <= 0n) {
			const total = base + margin;
			let limits = await ctx.db
				.query("limits")
				.withIndex("by_user", (q) => q.eq("userId", user._id))
				.unique();
			if (!limits) {
				await ctx.db.insert("limits", {
					userId: user._id,
					freeModeDailyUsdMicroQuota: 500_000n,
					freeModeUsedTodayUsdMicro: total,
					rollupDateEpochDay: Math.floor(Date.now() / 86400000),
				});
			} else {
				const epochDay = Math.floor(Date.now() / 86400000);
				const usedToday = limits.rollupDateEpochDay === epochDay ? limits.freeModeUsedTodayUsdMicro : 0n;
				const newUsed = usedToday + total;
				await ctx.db.patch(limits._id, {
					freeModeUsedTodayUsdMicro: newUsed,
					rollupDateEpochDay: epochDay,
				});
			}
		}
		return null;
	},
});

export const listAllowedModels = query({
	args: {},
	returns: v.array(v.string()),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return ["gpt-4o-mini"]; // anonymous => limited
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
			.unique();
		if (!user) return ["gpt-oss-20b"]; // not provisioned yet

		const wallet = await ctx.db
			.query("wallets")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.unique();
		const limits = await ctx.db
			.query("limits")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.unique();

		const whitelist = [
			"gpt-4o-mini",
			"gpt-4o",
		];

		const balance = wallet?.usdMicroBalance ?? 0n;
		const dailyQuota = limits?.freeModeDailyUsdMicroQuota ?? 500_000n; // $0.50
		const usedToday = limits?.freeModeUsedTodayUsdMicro ?? 0n;
		if (balance <= 0n) {
			if (usedToday >= dailyQuota) return [];
			return ["gpt-4o-mini"]; // limited mode
		}
		return whitelist;
	},
});

// Referral: create or get current user's referral code
export const generateMyReferralCode = mutation({
	args: {},
	returns: v.string(),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthenticated");
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
			.unique();
		if (!user) throw new Error("User missing");
		if (user.referralCode) return user.referralCode;
		const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
		function generateCode(): string {
			let code = "";
			for (let i = 0; i < 8; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
			return code;
		}
		let code = generateCode();
		// naive collision avoidance
		for (let i = 0; i < 5; i++) {
			const existing = await ctx.db.query("referrals").withIndex("by_code", (q) => q.eq("code", code)).unique();
			if (!existing) break;
			code = generateCode();
		}
		await ctx.db.insert("referrals", { code, ownerUserId: user._id, usesCount: 0 });
		await ctx.db.patch(user._id, { referralCode: code });
		return code;
	},
});

export const ownsConversation = query({
	args: { conversationId: v.id("conversations") },
	returns: v.boolean(),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return false;
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
			.unique();
		if (!user) return false;
		const conv = await ctx.db.get(args.conversationId);
		if (!conv) return false;
		return conv.userId === user._id;
	},
});

// Referral: apply a referral code for the current user
export const applyReferralCodeForSelf = mutation({
	args: { code: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthenticated");
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
			.unique();
		if (!user) throw new Error("User missing");
		if (user.referredByCode) return null; // already applied
		const ref = await ctx.db.query("referrals").withIndex("by_code", (q) => q.eq("code", args.code)).unique();
		if (!ref) throw new Error("Invalid code");
		if (ref.ownerUserId === user._id) throw new Error("Cannot refer yourself");
		await ctx.db.patch(user._id, { referredByCode: args.code });
		await ctx.db.patch(ref._id, { usesCount: ref.usesCount + 1 });
		return null;
	},
});

export const getWalletSummary = query({
	args: {},
	returns: v.union(
		v.null(),
		v.object({ balanceUsdMicro: v.int64() }),
	),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
			.unique();
		if (!user) return null;
		const wallet = await ctx.db
			.query("wallets")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.unique();
		return { balanceUsdMicro: wallet?.usdMicroBalance ?? 0n };
	},
});

export const getLimitsSummary = query({
	args: {},
	returns: v.union(
		v.null(),
		v.object({
			isLimited: v.boolean(),
			dailyQuotaUsdMicro: v.int64(),
			usedTodayUsdMicro: v.int64(),
		}),
	),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
			.unique();
		if (!user) return null;
		const wallet = await ctx.db
			.query("wallets")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.unique();
		const limits = await ctx.db
			.query("limits")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.unique();
		const balance = wallet?.usdMicroBalance ?? 0n;
		return {
			isLimited: balance <= 0n,
			dailyQuotaUsdMicro: limits?.freeModeDailyUsdMicroQuota ?? 500_000n,
			usedTodayUsdMicro: limits?.freeModeUsedTodayUsdMicro ?? 0n,
		};
	},
});

export const getCreditProgress = query({
	args: {},
	returns: v.union(
		v.null(),
		v.object({
			balanceUsdMicro: v.int64(),
			lastPaymentAt: v.union(v.number(), v.null()),
			usedSinceLastPaymentUsdMicro: v.int64(),
		}),
	),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
			.unique();
		if (!user) return null;
		const wallet = await ctx.db
			.query("wallets")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.unique();
		const balance = wallet?.usdMicroBalance ?? 0n;

		const txs = await ctx.db
			.query("creditTransactions")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.order("desc")
			.take(200);
		const lastPayment = txs.find((t) => t.source === "purchase" || t.source === "postpaid");
		const lastPaymentAt = lastPayment ? lastPayment._creationTime : null;
		let used: bigint = 0n;
		for (const t of txs) {
			if (lastPaymentAt !== null && t._creationTime < lastPaymentAt) break;
			if (t.source === "usage") used += -t.amountUsdMicro; // usage stored negative
		}
		return {
			balanceUsdMicro: balance,
			lastPaymentAt,
			usedSinceLastPaymentUsdMicro: used,
		};
	},
});

export const processPolarWebhook = mutation({
	args: {
		clerkUserId: v.optional(v.string()),
		userId: v.optional(v.id("users")),
		eventType: v.string(),
		amountUsdMicro: v.int64(),
		refId: v.optional(v.string()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		let userId: Id<"users"> | null = args.userId ?? null;
		if (!userId && args.clerkUserId) {
			const user = await ctx.db
				.query("users")
				.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId!))
				.unique();
			if (user) userId = user._id;
		}
		if (!userId) return null;

		const purchaseEvents = new Set(["checkout.paid", "invoice.paid", "subscription.renewed"]);
		if (purchaseEvents.has(args.eventType)) {
			await ctx.runMutation(api.index.applyCredit as any, {
				userId,
				amountUsdMicro: args.amountUsdMicro,
				source: "purchase",
				refId: args.refId,
			});

			// Referral bonus: if user has a referrer and this purchase meets threshold, award $10 to both once per refId
			const me = await ctx.db.get(userId);
			const threshold = 20_000_000n; // $20
			if (me && me.referredByCode && args.amountUsdMicro >= threshold) {
				// Check duplicate for this refId on either user via existing referral creditTransactions
				const myTx = await ctx.db
					.query("creditTransactions")
					.withIndex("by_user", (q) => q.eq("userId", userId))
					.order("desc")
					.take(50);
				const alreadyAwarded = myTx.some((t) => t.source === "referral" && t.refId === args.refId);
				if (!alreadyAwarded) {
					const ref = await ctx.db
						.query("referrals")
						.withIndex("by_code", (q) => q.eq("code", me.referredByCode as string))
						.unique();
					if (ref) {
						const ownerId = ref.ownerUserId as Id<"users">;
						const bonus = 10_000_000n; // $10
						await ctx.runMutation(api.index.applyCredit as any, {
							userId,
							amountUsdMicro: bonus,
							source: "referral",
							refId: args.refId,
						});
						await ctx.runMutation(api.index.applyCredit as any, {
							userId: ownerId,
							amountUsdMicro: bonus,
							source: "referral",
							refId: args.refId,
						});
						await ctx.db.insert("grants", { userId, type: "referral_friend", usdMicro: bonus });
						await ctx.db.insert("grants", { userId: ownerId, type: "referral_self", usdMicro: bonus });
					}
				}
			}
		}
		return null;
	},
});

export const applyCredit = mutation({
	args: {
		userId: v.id("users"),
		amountUsdMicro: v.int64(),
		source: v.union(
			v.literal("purchase"),
			v.literal("autorecharge"),
			v.literal("postpaid"),
			v.literal("adjustment"),
			v.literal("referral"),
			v.literal("welcome"),
		),
		refId: v.optional(v.string()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const wallet = await ctx.db
			.query("wallets")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();
		if (!wallet) throw new Error("Wallet missing");
		await ctx.db.patch(wallet._id, {
			usdMicroBalance: wallet.usdMicroBalance + args.amountUsdMicro,
			updatedAt: Date.now(),
		});
		await ctx.db.insert("creditTransactions", {
			userId: args.userId,
			amountUsdMicro: args.amountUsdMicro,
			source: args.source,
			refId: args.refId,
		});
		return null;
	},
});

export const createRegexSession = mutation({
	args: {
		prompt: v.string(),
		dialect: v.union(v.literal("ecmascript"), v.literal("pcre")),
		pattern: v.string(),
		explanation: v.optional(v.string()),
		sample: v.optional(v.string()),
		matches: v.optional(v.array(v.string())),
	},
	returns: v.id("regexSessions"),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthenticated");
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
			.unique();
		if (!user) throw new Error("User missing");
		const id = await ctx.db.insert("regexSessions", {
			userId: user._id,
			prompt: args.prompt,
			dialect: args.dialect,
			pattern: args.pattern,
			explanation: args.explanation,
			sample: args.sample,
			matches: args.matches,
		});
		return id;
	},
});

export const listMyRegexSessions = query({
	args: {},
	returns: v.array(
		v.object({
			_id: v.id("regexSessions"),
			_creationTime: v.number(),
			prompt: v.string(),
			dialect: v.union(v.literal("ecmascript"), v.literal("pcre")),
			pattern: v.string(),
		}),
	),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
			.unique();
		if (!user) return [];
		const rows = await ctx.db
			.query("regexSessions")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.order("desc")
			.take(50);
		return rows.map((r) => ({ _id: r._id, _creationTime: r._creationTime, prompt: r.prompt, dialect: r.dialect, pattern: r.pattern }));
	},
});

export const ensureWalletWithWelcome = mutation({
	args: { userId: v.id("users"), welcomeUsdMicro: v.int64() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("wallets")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();
		if (!existing) {
			await ctx.db.insert("wallets", {
				userId: args.userId,
				usdMicroBalance: args.welcomeUsdMicro,
				updatedAt: Date.now(),
			});
			await ctx.db.insert("grants", {
				userId: args.userId,
				type: "welcome",
				usdMicro: args.welcomeUsdMicro,
			});
			await ctx.db.insert("creditTransactions", {
				userId: args.userId,
				amountUsdMicro: args.welcomeUsdMicro,
				source: "welcome",
				refId: undefined,
			});
		}
		return null;
	},
});

export const logUsageEventAndDebit = internalMutation({
	args: {
		userId: v.id("users"),
		toolSlug: v.string(),
		modelId: v.string(),
		promptTokens: v.number(),
		completionTokens: v.number(),
		usdMicroCost: v.int64(),
		usdMicroMargin: v.int64(),
		gatewayRequestId: v.optional(v.string()),
		rateVersion: v.optional(v.number()),
		status: v.string(),
	},
	returns: v.id("usageEvents"),
	handler: async (ctx, args) => {
		const usageId = await ctx.db.insert("usageEvents", {
			userId: args.userId,
			toolSlug: args.toolSlug,
			modelId: args.modelId,
			promptTokens: args.promptTokens,
			completionTokens: args.completionTokens,
			usdMicroCost: args.usdMicroCost,
			usdMicroMargin: args.usdMicroMargin,
			gatewayRequestId: args.gatewayRequestId ?? "",
			rateVersion: args.rateVersion ?? 0,
			status: args.status,
		});
		const wallet = await ctx.db
			.query("wallets")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();
		if (wallet) {
			const delta = -1n * (args.usdMicroCost + args.usdMicroMargin);
			await ctx.db.patch(wallet._id, {
				usdMicroBalance: wallet.usdMicroBalance + delta,
				updatedAt: Date.now(),
			});
			await ctx.db.insert("creditTransactions", {
				userId: args.userId,
				amountUsdMicro: delta,
				source: "usage",
				refId: usageId,
			});
		}
		return usageId;
	},
});

// Daily model rate sync via gateway
export const syncModelRates = action({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		const url = process.env.GATEWAY_MODELS_URL;
		if (!url) return null;
		const res = await fetch(url);
		if (!res.ok) return null;
		const models = (await res.json()) as Array<{
			modelId: string;
			provider: string;
			inputPerMillionUsdMicro: number;
			outputPerMillionUsdMicro: number;
		}>;
		const nowVersion = Date.now();
		for (const m of models) {
			await ctx.runMutation(internal.index.upsertModelRate, {
				modelId: m.modelId,
				provider: m.provider,
				inputPerMillionUsdMicro: BigInt(m.inputPerMillionUsdMicro),
				outputPerMillionUsdMicro: BigInt(m.outputPerMillionUsdMicro),
				version: nowVersion,
			});
		}
		return null;
	},
});

export const upsertModelRate = internalMutation({
	args: {
		modelId: v.string(),
		provider: v.string(),
		inputPerMillionUsdMicro: v.int64(),
		outputPerMillionUsdMicro: v.int64(),
		version: v.number(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await ctx.db.insert("modelRates", {
			modelId: args.modelId,
			provider: args.provider,
			inputPerMillionUsdMicro: args.inputPerMillionUsdMicro,
			outputPerMillionUsdMicro: args.outputPerMillionUsdMicro,
			version: args.version,
			effectiveFrom: Date.now(),
			isActive: true,
		});
		return null;
	},
});

// Postpaid cycle settlement: compute outstanding usage and create a due cycle
export const closePostpaidCycles = action({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		// Find recent usage events and settle per user
		// Note: This is a simple heuristic pass; for scale, shard by user ids
		const now = Date.now();
		const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
		const since = now - thirtyDaysMs;

		// Read distinct userIds from recent usage events via helper
		const userIds: Array<Id<"users">> = await ctx.runQuery(internal.index._recentUsageUserIds as any, {
			since,
			limit: 200,
		});

		for (const userId of userIds) {

			// Determine last cycle end
			const lastCycle = await ctx.runQuery(internal.index._getLastPostpaidCycleForUser as any, { userId });
			const windowStart = lastCycle?.windowEnd ?? since;

			// Sum usage since windowStart
			const total = await ctx.runQuery(internal.index._sumUsageSince as any, { userId, since: windowStart });
			if (total <= 0n) continue;

			// Avoid duplicate cycles: if we already created a cycle in last 24h, skip
			const dup = await ctx.runQuery(internal.index._hasRecentCycle as any, { userId, cutoffMs: now - 24 * 60 * 60 * 1000 });
			if (dup) continue;

			await ctx.runMutation(internal.index._insertPostpaidCycle as any, {
				userId,
				windowStart,
				windowEnd: now,
				usdMicroCharges: total,
				status: "due",
			});
		}
		return null;
	},
});

export const _getLastPostpaidCycleForUser = internalQuery({
	args: { userId: v.id("users") },
	returns: v.union(
		v.null(),
		v.object({ windowEnd: v.number() }),
	),
	handler: async (ctx, args) => {
		const cycles = await ctx.db
			.query("postpaidCycles")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.order("desc")
			.take(1);
		if (cycles.length === 0) return null;
		return { windowEnd: cycles[0].windowEnd };
	},
});

export const _sumUsageSince = internalQuery({
	args: { userId: v.id("users"), since: v.number() },
	returns: v.int64(),
	handler: async (ctx, args) => {
		let total: bigint = 0n;
		for await (const u of ctx.db.query("usageEvents").withIndex("by_user", (q) => q.eq("userId", args.userId)) as any) {
			// @ts-ignore
			if (u._creationTime < args.since) continue;
			total += u.usdMicroCost + u.usdMicroMargin;
		}
		return total;
	},
});

export const _hasRecentCycle = internalQuery({
	args: { userId: v.id("users"), cutoffMs: v.number() },
	returns: v.boolean(),
	handler: async (ctx, args) => {
		const cycles = await ctx.db
			.query("postpaidCycles")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.order("desc")
			.take(1);
		if (cycles.length === 0) return false;
		return cycles[0].windowEnd >= args.cutoffMs;
	},
});

export const _insertPostpaidCycle = internalMutation({
	args: { userId: v.id("users"), windowStart: v.number(), windowEnd: v.number(), usdMicroCharges: v.int64(), status: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		await ctx.db.insert("postpaidCycles", args);
		return null;
	},
});

export const _recentUsageUserIds = internalQuery({
	args: { since: v.number(), limit: v.number() },
	returns: v.array(v.id("users")),
	handler: async (ctx, args) => {
		const unique: Array<Id<"users">> = [];
		const seen: Set<string> = new Set();
		const recent = await ctx.db.query("usageEvents").order("desc").take(500);
		for (const u of recent) {
			if (u._creationTime < args.since) break;
			const key = u.userId as unknown as string;
			if (!seen.has(key)) {
				seen.add(key);
				unique.push(u.userId);
				if (unique.length >= args.limit) break;
			}
		}
		return unique;
	},
});



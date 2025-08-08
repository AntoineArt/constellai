import { query, mutation, internalAction, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

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
			referralCode: null as unknown as string | undefined,
			referredByCode: null as unknown as string | undefined,
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
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthenticated");
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
			.unique();
		if (!user) throw new Error("User missing");
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
	args: { conversationId: v.id("conversations"), content: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		await ctx.db.insert("messages", {
			conversationId: args.conversationId,
			role: "user",
			content: args.content,
		});
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



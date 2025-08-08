import { query, mutation, internalAction, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

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



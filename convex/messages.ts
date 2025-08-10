import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByThread = query({
	args: { threadId: v.id("threads") },
	returns: v.array(
		v.object({
			_id: v.id("messages"),
			threadId: v.id("threads"),
			role: v.union(v.literal("user"), v.literal("assistant")),
			content: v.string(),
			createdAt: v.number(),
			_creationTime: v.number(),
		})
	),
	handler: async (ctx, { threadId }) => {
		const rows = await ctx.db
			.query("messages")
			.withIndex("by_thread_and_time", (q) => q.eq("threadId", threadId))
			.order("asc")
			.collect();

		return rows.map(({ _id, threadId, role, content, createdAt, _creationTime }) => ({
			_id,
			threadId,
			role,
			content,
			createdAt,
			_creationTime,
		}));
	},
});

export const append = mutation({
	args: {
		threadId: v.id("threads"),
		role: v.union(v.literal("user"), v.literal("assistant")),
		content: v.string(),
	},
	returns: v.id("messages"),
	handler: async (ctx, { threadId, role, content }) => {
		const id = await ctx.db.insert("messages", {
			threadId,
			role,
			content,
			createdAt: Date.now(),
		});

		await ctx.db.patch(threadId, { lastMessage: content, updatedAt: Date.now() });
		return id;
	},
});



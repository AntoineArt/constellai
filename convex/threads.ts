import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
	args: {},
	returns: v.array(
		v.object({
			_id: v.id("threads"),
			title: v.string(),
			lastMessage: v.optional(v.string()),
			updatedAt: v.number(),
		})
	),
	handler: async (ctx) => {
		const rows = await ctx.db.query("threads").withIndex("by_updated_at").order("desc").collect();
		return rows.map(({ _id, title, lastMessage, updatedAt }) => ({ _id, title, lastMessage, updatedAt }));
	},
});

export const create = mutation({
	args: { title: v.string() },
	returns: v.id("threads"),
	handler: async (ctx, { title }) => {
		const now = Date.now();
		return await ctx.db.insert("threads", { title, updatedAt: now });
	},
});

export const rename = mutation({
	args: { id: v.id("threads"), title: v.string() },
	returns: v.null(),
	handler: async (ctx, { id, title }) => {
		await ctx.db.patch(id, { title, updatedAt: Date.now() });
		return null;
	},
});



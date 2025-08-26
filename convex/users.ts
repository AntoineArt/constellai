import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const createUser = mutation({
	args: {
		name: v.string(),
		email: v.string(),
	},
	returns: v.id("users"),
	handler: async (ctx, args) => {
		return await ctx.db.insert("users", {
			name: args.name,
			email: args.email,
			createdAt: Date.now(),
		});
	},
});

export const getUser = query({
	args: {
		userId: v.id("users"),
	},
	returns: v.union(
		v.object({
			_id: v.id("users"),
			_creationTime: v.number(),
			name: v.string(),
			email: v.string(),
			createdAt: v.number(),
		}),
		v.null()
	),
	handler: async (ctx, args) => {
		return await ctx.db.get(args.userId);
	},
});

export const listUsers = query({
	args: {},
	returns: v.array(
		v.object({
			_id: v.id("users"),
			_creationTime: v.number(),
			name: v.string(),
			email: v.string(),
			createdAt: v.number(),
		})
	),
	handler: async (ctx) => {
		return await ctx.db.query("users").collect();
	},
});

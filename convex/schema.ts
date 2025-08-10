import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	threads: defineTable({
		title: v.string(),
		streamId: v.optional(v.string()),
		lastMessage: v.optional(v.string()),
		updatedAt: v.number(),
	}).index("by_updated_at", ["updatedAt"]),
	messages: defineTable({
		threadId: v.id("threads"),
		role: v.union(v.literal("user"), v.literal("assistant")),
		content: v.string(),
		createdAt: v.number(),
	}).index("by_thread_and_time", ["threadId", "createdAt"]),
});



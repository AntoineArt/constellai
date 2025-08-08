import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	users: defineTable({
		clerkUserId: v.string(),
		email: v.string(),
		referralCode: v.optional(v.string()),
		referredByCode: v.optional(v.string()),
	}).index("by_clerk_user_id", ["clerkUserId"]),

	wallets: defineTable({
		userId: v.id("users"),
		usdMicroBalance: v.int64(),
		updatedAt: v.number(),
	}).index("by_user", ["userId"]),

	creditTransactions: defineTable({
		userId: v.id("users"),
		amountUsdMicro: v.int64(),
		source: v.union(
			v.literal("purchase"),
			v.literal("usage"),
			v.literal("welcome"),
			v.literal("referral"),
			v.literal("autorecharge"),
			v.literal("postpaid"),
			v.literal("adjustment"),
		),
		refId: v.optional(v.string()),
	}).index("by_user", ["userId"]),

	usageEvents: defineTable({
		userId: v.id("users"),
		toolSlug: v.string(),
		modelId: v.string(),
		promptTokens: v.number(),
		completionTokens: v.number(),
		usdMicroCost: v.int64(),
		usdMicroMargin: v.int64(),
		gatewayRequestId: v.string(),
		rateVersion: v.number(),
		status: v.string(),
	}).index("by_user", ["userId"]),

	toolExecutions: defineTable({
		userId: v.id("users"),
		toolSlug: v.string(),
		modelId: v.string(),
		input: v.string(),
		output: v.optional(v.string()),
		durationMs: v.optional(v.number()),
		usageEventId: v.optional(v.id("usageEvents")),
		deletedAt: v.optional(v.number()),
	}).index("by_user", ["userId"]),

	tools: defineTable({
		slug: v.string(),
		name: v.string(),
		category: v.optional(v.string()),
		tags: v.array(v.string()),
		isActive: v.boolean(),
		defaultModelId: v.string(),
		freeModeEnabled: v.boolean(),
		freeModeModels: v.array(v.string()),
	}).index("by_slug", ["slug"]),

	toolPins: defineTable({
		userId: v.id("users"),
		toolSlug: v.string(),
		position: v.number(),
	}).index("by_user", ["userId"]),

	limits: defineTable({
		userId: v.id("users"),
		freeModeDailyUsdMicroQuota: v.int64(),
		freeModeUsedTodayUsdMicro: v.int64(),
		rollupDateEpochDay: v.number(),
	}).index("by_user", ["userId"]),

	modelRates: defineTable({
		modelId: v.string(),
		provider: v.string(),
		inputPerMillionUsdMicro: v.int64(),
		outputPerMillionUsdMicro: v.int64(),
		version: v.number(),
		effectiveFrom: v.number(),
		isActive: v.boolean(),
	}).index("by_model_and_version", ["modelId", "version"]),

	postpaidCycles: defineTable({
		userId: v.id("users"),
		windowStart: v.number(),
		windowEnd: v.number(),
		usdMicroCharges: v.int64(),
		status: v.string(),
	}).index("by_user", ["userId"]),

	referrals: defineTable({
		code: v.string(),
		ownerUserId: v.id("users"),
		usesCount: v.number(),
	}).index("by_code", ["code"]),

	grants: defineTable({
		userId: v.id("users"),
		type: v.union(v.literal("welcome"), v.literal("referral_self"), v.literal("referral_friend")),
		usdMicro: v.int64(),
	}).index("by_user", ["userId"]),

	conversations: defineTable({
		userId: v.id("users"),
		title: v.optional(v.string()),
		modelId: v.string(),
		lastActivityTime: v.number(),
	}).index("by_user_and_last_activity", ["userId", "lastActivityTime"]),

	messages: defineTable({
		conversationId: v.id("conversations"),
		role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
		content: v.string(),
		attachments: v.optional(v.array(v.object({
			kind: v.string(),
			url: v.string(),
			name: v.optional(v.string()),
			size: v.optional(v.number()),
			contentType: v.optional(v.string()),
		}))),
	}).index("by_conversation", ["conversationId"]),

	regexSessions: defineTable({
		userId: v.id("users"),
		prompt: v.string(),
		dialect: v.union(v.literal("ecmascript"), v.literal("pcre")),
		pattern: v.string(),
		explanation: v.optional(v.string()),
		sample: v.optional(v.string()),
		matches: v.optional(v.array(v.string())),
	}).index("by_user", ["userId"]),
});



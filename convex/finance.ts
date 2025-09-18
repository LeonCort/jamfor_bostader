import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserIdOrThrow } from "./utils";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserIdOrThrow(ctx);
    const rows = await ctx.db.query("finance_settings").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    return rows[0] ?? null;
  },
});

export const upsert = mutation({
  args: {
    downPaymentRate: v.number(),
    interestRateAnnual: v.number(),
    incomeMonthlyPerson1: v.optional(v.number()),
    incomeMonthlyPerson2: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdOrThrow(ctx);
    const rows = await ctx.db.query("finance_settings").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const now = Date.now();
    if (rows[0]) {
      await ctx.db.patch(rows[0]._id, { ...args, updatedAt: now });
      return rows[0]._id;
    }
    return await ctx.db.insert("finance_settings", { userId, ...args, createdAt: now, updatedAt: now });
  },
});


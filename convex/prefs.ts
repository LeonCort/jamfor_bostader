import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserIdOrThrow } from "./utils";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserIdOrThrow(ctx);
    const rows = await ctx.db.query("user_prefs").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    return rows[0]?.cardConfig ?? null;
  },
});

export const set = mutation({
  args: { cardConfig: v.any() },
  handler: async (ctx, { cardConfig }) => {
    const userId = await getUserIdOrThrow(ctx);
    const rows = await ctx.db.query("user_prefs").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const now = Date.now();
    if (rows[0]) {
      await ctx.db.patch(rows[0]._id, { cardConfig, updatedAt: now });
      return rows[0]._id;
    }
    return await ctx.db.insert("user_prefs", { userId, cardConfig, createdAt: now, updatedAt: now });
  },
});


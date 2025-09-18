import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserIdOrThrow } from "./utils";
import { api } from "./_generated/api";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserIdOrThrow(ctx);
    return await ctx.db.query("places").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
  },
});

export const add = mutation({
  args: {
    clientId: v.string(),
    label: v.optional(v.string()),
    address: v.optional(v.string()),
    icon: v.optional(v.string()),
    arriveBy: v.optional(v.string()),
    leaveAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdOrThrow(ctx);
    const now = Date.now();
    const id = await ctx.db.insert("places", { userId, ...args, createdAt: now, updatedAt: now });

    // Schedule commute calculations for all existing accommodations (transit only)
    const place = await ctx.db.get(id);
    if (place) {
      const destination = place.address ?? place.label ?? null;
      if (destination) {
        const accs = await ctx.db
          .query("accommodations")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect();
        for (const a of accs) {
          const origin = (a.address ?? a.title ?? null) as string | null;
          if (!origin) continue;
          await ctx.scheduler.runAfter(0, api.commute.fetchDirections, {
            origin,
            destination,
            mode: "transit",
            arriveBy: place.arriveBy ?? undefined,
            accommodationId: a._id,
            placeId: id,
          });
        }
      }
    }

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("places"),
    patch: v.object({
      label: v.optional(v.string()),
      address: v.optional(v.string()),
      icon: v.optional(v.string()),
      arriveBy: v.optional(v.string()),
      leaveAt: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { id, patch }) => {
    const userId = await getUserIdOrThrow(ctx);
    const doc = await ctx.db.get(id);
    if (!doc || doc.userId !== userId) throw new Error("Not found");
    const prevDestination = doc.address ?? doc.label ?? null;
    await ctx.db.patch(id, { ...patch, updatedAt: Date.now() });

    // If destination or arriveBy changed, re-schedule commute for all accommodations
    const nextDestination = (patch.address ?? doc.address) ?? (patch.label ?? doc.label) ?? null;
    const arriveBy = patch.arriveBy ?? doc.arriveBy ?? undefined;
    if (nextDestination && nextDestination !== prevDestination) {
      const accs = await ctx.db.query("accommodations").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
      for (const a of accs) {
        const origin = (a.address ?? a.title ?? null) as string | null;
        if (!origin) continue;
        await ctx.scheduler.runAfter(0, api.commute.fetchDirections, {
          origin,
          destination: nextDestination,
          mode: "transit",
          arriveBy,
          accommodationId: a._id,
          placeId: id,
        });
      }
    }
  },
});

export const bulkReplace = mutation({
  args: { places: v.array(v.object({
    clientId: v.string(),
    label: v.optional(v.string()),
    address: v.optional(v.string()),
    icon: v.optional(v.string()),
    arriveBy: v.optional(v.string()),
    leaveAt: v.optional(v.string()),
  })) },
  handler: async (ctx, { places }) => {
    const userId = await getUserIdOrThrow(ctx);
    const now = Date.now();
    const existing = await ctx.db.query("places").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const byClient = new Map(existing.map((p) => [p.clientId, p]));
    const keep = new Set(places.map((p) => p.clientId));

    // Upsert
    for (const p of places) {
      const prev = byClient.get(p.clientId);
      if (prev) {
        await ctx.db.patch(prev._id, { ...p, updatedAt: now });
      } else {
        const id = await ctx.db.insert("places", { userId, ...p, createdAt: now, updatedAt: now });
        // Schedule commute for all accommodations
        const accs = await ctx.db.query("accommodations").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
        const destination = p.address ?? p.label ?? null;
        if (destination) {
          for (const a of accs) {
            const origin = (a.address ?? a.title ?? null) as string | null;
            if (!origin) continue;
            await ctx.scheduler.runAfter(0, api.commute.fetchDirections, {
              origin,
              destination,
              mode: "transit",
              arriveBy: p.arriveBy ?? undefined,
              accommodationId: a._id,
              placeId: id,
            });
          }
        }
      }
    }

    // Delete removed
    for (const prev of existing) {
      if (!keep.has(prev.clientId)) {
        // delete commute_results for this place
        const results = await ctx.db.query("commute_results").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
        for (const r of results) {
          if (r.placeId === prev._id) await ctx.db.delete(r._id);
        }
        await ctx.db.delete(prev._id);
      }
    }

    return { upserted: places.length, deleted: existing.length - keep.size };
  },
});

export const remove = mutation({
  args: { id: v.id("places") },
  handler: async (ctx, { id }) => {
    const userId = await getUserIdOrThrow(ctx);
    const doc = await ctx.db.get(id);
    if (!doc || doc.userId !== userId) throw new Error("Not found");

    // Clean up commute_results for this place
    const results = await ctx.db.query("commute_results").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    for (const r of results) {
      if (r.placeId === id) await ctx.db.delete(r._id);
    }

    await ctx.db.delete(id);
  },
});


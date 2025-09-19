import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { getUserIdOrThrow } from "./utils";

export const listForUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserIdOrThrow(ctx);
    return await ctx.db.query("commute_results").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
  },
});

export const upsertResult = mutation({
  args: {
    accommodationId: v.id("accommodations"),
    placeId: v.id("places"),
    mode: v.union(v.literal("transit"), v.literal("driving"), v.literal("bicycling")),
    minutes: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdOrThrow(ctx);
    const now = Date.now();
    const existing = await ctx.db
      .query("commute_results")
      .withIndex("by_user_apm", (q) => q
        .eq("userId", userId)
        .eq("accommodationId", args.accommodationId)
        .eq("placeId", args.placeId)
        .eq("mode", args.mode))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { minutes: args.minutes, updatedAt: now });
      return existing._id;
    }
    return await ctx.db.insert("commute_results", { userId, ...args, updatedAt: now });
  },
});

export const scheduleAllForUser = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserIdOrThrow(ctx);
    const accs = await ctx.db.query("accommodations").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const places = await ctx.db.query("places").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    let scheduled = 0;
    for (const a of accs) {
      const origin = (a.address ?? a.title ?? null) as string | null;
      if (!origin) continue;
      for (const p of places) {
        const destination = (p.address ?? p.label ?? null) as string | null;
        if (!destination) continue;
        await ctx.scheduler.runAfter(0, api.commute.fetchDirections, {
          origin,
          destination,
          mode: "transit",
          arriveBy: p.arriveBy ?? undefined,
          accommodationId: a._id,
          placeId: p._id,
        });
        scheduled++;
      }
    }
    return { scheduled };
  },
});

export const fetchDirections = action({
  args: {
    origin: v.string(),
    destination: v.string(),
    mode: v.union(v.literal("transit"), v.literal("driving"), v.literal("bicycling")),
    arriveBy: v.optional(v.string()), // HH:MM, transit only
    accommodationId: v.id("accommodations"),
    placeId: v.id("places"),
  },
  handler: async (ctx, { origin, destination, mode, arriveBy, accommodationId, placeId }) => {
    // For scheduled actions, we need to get the userId from the accommodation/place records
    // since the auth context is not available in scheduled actions
    const identity = await ctx.auth.getUserIdentity();
    let userId: string;

    if (identity) {
      // Direct call with auth context
      userId = identity.subject;
    } else {
      // Scheduled call - get userId from the accommodation record
      const accommodation = await ctx.runQuery(api.accommodations.getById, { id: accommodationId });
      if (!accommodation) throw new Error("Accommodation not found");
      userId = accommodation.userId;
    }
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) throw new Error("Missing GOOGLE_MAPS_API_KEY in Convex env");

    const params: Record<string, string> = { origin, destination, mode };
    if (mode === "transit" && arriveBy) {
      // Compute next Monday at local time HH:MM
      const [hh, mm] = arriveBy.split(":").map(Number);
      const now = new Date();
      const day = now.getDay();
      const delta = (1 - day + 7) % 7; // 1 = Monday
      const dt = new Date(now);
      dt.setDate(now.getDate() + delta);
      dt.setHours(hh, mm, 0, 0);
      params.arrival_time = String(Math.floor(dt.getTime() / 1000));
    } else if (mode === "transit") {
      params.departure_time = String(Math.floor(Date.now() / 1000));
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json?` + new URLSearchParams({ ...params, key }).toString();
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Directions failed: ${resp.status}`);
    const json = await resp.json();
    const minutes = extractMinutes(json);
    if (minutes != null) {
      await ctx.runMutation(api.commute.upsertResult, { accommodationId, placeId, mode, minutes });
    }
    return { minutes };
  },
});

function extractMinutes(json: any): number | null {
  try {
    const leg = json?.routes?.[0]?.legs?.[0];
    if (!leg) return null;
    const secs = leg.duration?.value ?? leg.duration_in_traffic?.value;
    if (!secs) return null;
    return Math.round(secs / 60);
  } catch {
    return null;
  }
}


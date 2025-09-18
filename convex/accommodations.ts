import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserIdOrThrow } from "./utils";
import { api } from "./_generated/api";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserIdOrThrow(ctx);
    return await ctx.db.query("accommodations").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
  },
});

export const add = mutation({
  args: {
    clientId: v.string(),
    kind: v.union(v.literal("candidate"), v.literal("current")),
    title: v.optional(v.string()),
    address: v.optional(v.string()),
    postort: v.optional(v.string()),
    kommun: v.optional(v.string()),
    color: v.optional(v.string()),
    position: v.optional(v.object({ xPercent: v.number(), yPercent: v.number() })),
    imageUrl: v.optional(v.string()),
    begartPris: v.optional(v.number()),
    driftkostnader: v.optional(v.number()),
    hyra: v.optional(v.number()),
    antalRum: v.optional(v.number()),
    boarea: v.optional(v.number()),
    biarea: v.optional(v.number()),
    tomtarea: v.optional(v.number()),
    constructionYear: v.optional(v.number()),
    meta: v.optional(v.object({ type: v.optional(v.string()), tenure: v.optional(v.string()), energyClass: v.optional(v.string()) })),
    sourceUrls: v.optional(v.object({ hemnet: v.optional(v.string()), realtor: v.optional(v.string()) })),
    media: v.optional(v.object({ images: v.array(v.string()), floorPlans: v.array(v.string()) })),
    hemnetStats: v.optional(v.object({ daysOnHemnet: v.optional(v.number()), timesViewed: v.optional(v.number()), labels: v.array(v.string()) })),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdOrThrow(ctx);
    const now = Date.now();
    const id = await ctx.db.insert("accommodations", {
      userId,
      clientId: args.clientId,
      kind: args.kind,
      title: args.title,
      address: args.address,
      postort: args.postort,
      kommun: args.kommun,
      color: args.color,
      position: args.position as any,
      imageUrl: args.imageUrl,
      begartPris: args.begartPris,
      driftkostnader: args.driftkostnader,
      hyra: args.hyra,
      antalRum: args.antalRum,
      boarea: args.boarea,
      biarea: args.biarea,
      tomtarea: args.tomtarea,
      constructionYear: args.constructionYear,
      meta: args.meta,
      sourceUrls: args.sourceUrls,
      media: args.media,
      hemnetStats: args.hemnetStats,
      createdAt: now,
      updatedAt: now,
    });

    // Schedule commute calculations for all existing places (transit only)
    const acc = await ctx.db.get(id);
    if (acc) {
      const origin = acc.address ?? acc.title ?? null;
      if (origin) {
        const places = await ctx.db
          .query("places")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect();
        for (const p of places) {
          const destination = (p.address ?? p.label ?? null) as string | null;
          if (!destination) continue;
          await ctx.scheduler.runAfter(0, api.commute.fetchDirections, {
            origin,
            destination,
            mode: "transit",
            arriveBy: p.arriveBy ?? undefined,
            accommodationId: id,
            placeId: p._id,
          });
        }
      }
    }

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("accommodations"),
    patch: v.object({
      title: v.optional(v.string()),
      address: v.optional(v.string()),
      begartPris: v.optional(v.number()),
      currentValuation: v.optional(v.number()),
      hyra: v.optional(v.number()),
      driftkostnader: v.optional(v.number()),
      antalRum: v.optional(v.number()),
      boarea: v.optional(v.number()),
      biarea: v.optional(v.number()),
      tomtarea: v.optional(v.number()),
      constructionYear: v.optional(v.number()),
      meta: v.optional(v.object({ type: v.optional(v.string()), tenure: v.optional(v.string()), energyClass: v.optional(v.string()) })),
    }),
  },
  handler: async (ctx, { id, patch }) => {
    const userId = await getUserIdOrThrow(ctx);
    const doc = await ctx.db.get(id);
    if (!doc || doc.userId !== userId) throw new Error("Not found");

    const prevOrigin = doc.address ?? doc.title ?? null;
    const mergedMeta = patch.meta ? { ...(doc.meta ?? {}), ...patch.meta } : undefined;
    const toWrite: any = { ...patch, ...(mergedMeta ? { meta: mergedMeta } : {}), updatedAt: Date.now() };

    await ctx.db.patch(id, toWrite);

    // If origin changed (address/title), re-schedule commute for all places
    const nextOrigin = (patch.address ?? doc.address) ?? (patch.title ?? doc.title) ?? null;
    if (nextOrigin && nextOrigin !== prevOrigin) {
      const places = await ctx.db.query("places").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
      for (const p of places) {
        const destination = (p.address ?? p.label ?? null) as string | null;
        if (!destination) continue;
        await ctx.scheduler.runAfter(0, api.commute.fetchDirections, {
          origin: nextOrigin,
          destination,
          mode: "transit",
          arriveBy: p.arriveBy ?? undefined,
          accommodationId: id,
          placeId: p._id,
        });
      }
    }
  },
});

export const upsertCurrent = mutation({
  args: {
    clientId: v.string(),
    title: v.optional(v.string()),
    address: v.optional(v.string()),
    hyra: v.optional(v.number()),
    driftkostnader: v.optional(v.number()),
    antalRum: v.optional(v.number()),
    boarea: v.optional(v.number()),
    biarea: v.optional(v.number()),
    tomtarea: v.optional(v.number()),
    currentValuation: v.optional(v.number()),
    loans: v.optional(v.array(v.object({ principal: v.number(), interestRateAnnual: v.number() }))),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdOrThrow(ctx);
    const now = Date.now();
    const byClient = await ctx.db
      .query("accommodations")
      .withIndex("by_user_client", (q) => q.eq("userId", userId).eq("clientId", args.clientId))
      .unique();
    let doc = byClient;
    if (!doc) {
      const existingCurrent = (await ctx.db
        .query("accommodations")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()).find((a) => a.kind === "current");
      if (existingCurrent) doc = existingCurrent;
    }

    const patch: any = {
      title: args.title,
      address: args.address,
      hyra: args.hyra,
      driftkostnader: args.driftkostnader,
      antalRum: args.antalRum,
      boarea: args.boarea,
      biarea: args.biarea,
      tomtarea: args.tomtarea,
      currentValuation: args.currentValuation,
      mortgage: args.loans ? { loans: args.loans } : undefined,
      updatedAt: now,
    };

    if (doc) {
      const prevOrigin = doc.address ?? doc.title ?? null;
      await ctx.db.patch(doc._id, { ...patch, clientId: args.clientId, kind: "current" });
      const nextOrigin = (patch.address ?? doc.address) ?? (patch.title ?? doc.title) ?? null;
      if (nextOrigin && nextOrigin !== prevOrigin) {
        const places = await ctx.db.query("places").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
        for (const p of places) {
          const destination = (p.address ?? p.label ?? null) as string | null;
          if (!destination) continue;
          await ctx.scheduler.runAfter(0, api.commute.fetchDirections, {
            origin: nextOrigin,
            destination,
            mode: "transit",
            arriveBy: p.arriveBy ?? undefined,
            accommodationId: doc._id,
            placeId: p._id,
          });
        }
      }
      return doc._id;
    } else {
      const id = await ctx.db.insert("accommodations", {
        userId,
        clientId: args.clientId,
        kind: "current",
        title: args.title,
        address: args.address,
        hyra: args.hyra,
        driftkostnader: args.driftkostnader,
        antalRum: args.antalRum,
        boarea: args.boarea,
        biarea: args.biarea,
        tomtarea: args.tomtarea,
        currentValuation: args.currentValuation,
        mortgage: args.loans ? { loans: args.loans } : undefined,
        createdAt: now,
        updatedAt: now,
      } as any);
      const acc = await ctx.db.get(id);
      if (acc) {
        const origin = acc.address ?? acc.title ?? null;
        if (origin) {
          const places = await ctx.db.query("places").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
          for (const p of places) {
            const destination = (p.address ?? p.label ?? null) as string | null;
            if (!destination) continue;
            await ctx.scheduler.runAfter(0, api.commute.fetchDirections, {
              origin,
              destination,
              mode: "transit",
              arriveBy: p.arriveBy ?? undefined,
              accommodationId: id,
              placeId: p._id,
            });
          }
        }
      }
      return id;
    }
  },
});


export const remove = mutation({
  args: { id: v.id("accommodations") },
  handler: async (ctx, { id }) => {
    const userId = await getUserIdOrThrow(ctx);
    const doc = await ctx.db.get(id);
    if (!doc || doc.userId !== userId) throw new Error("Not found");

    // Clean up commute_results for this accommodation
    const results = await ctx.db.query("commute_results").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    for (const r of results) {
      if (r.accommodationId === id) await ctx.db.delete(r._id);
    }

    await ctx.db.delete(id);
  },
});


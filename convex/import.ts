import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserIdOrThrow } from "./utils";

export const importFromClient = mutation({
  args: {
    accommodations: v.optional(v.any()),
    places: v.optional(v.any()),
    finance: v.optional(v.any()),
    prefs: v.optional(v.any()),
  },
  handler: async (ctx, { accommodations, places, finance, prefs }) => {
    const userId = await getUserIdOrThrow(ctx);
    const now = Date.now();

    let accUpserts = 0;
    let placeUpserts = 0;

    if (Array.isArray(accommodations)) {
      for (const a of accommodations) {
        const clientId = String(a?.id ?? a?.clientId ?? "");
        if (!clientId) continue;
        const existing = await ctx.db
          .query("accommodations")
          .withIndex("by_user_client", (q) => q.eq("userId", userId).eq("clientId", clientId))
          .unique();

        const doc = {
          userId,
          clientId,
          kind: (a?.kind === "current" ? "current" : "candidate") as "current" | "candidate",
          title: a?.title ?? null,
          address: a?.address ?? null,
          postort: a?.postort ?? null,
          kommun: a?.kommun ?? null,
          color: a?.color ?? null,
          position: a?.position ?? null,
          imageUrl: a?.imageUrl ?? null,
          begartPris: isFiniteNum(a?.begartPris) ? a.begartPris : null,
          driftkostnader: isFiniteNum(a?.driftkostnader) ? a.driftkostnader : null,
          hyra: isFiniteNum(a?.hyra) ? a.hyra : null,
          antalRum: isFiniteNum(a?.antalRum) ? a.antalRum : null,
          boarea: isFiniteNum(a?.boarea) ? a.boarea : null,
          biarea: isFiniteNum(a?.biarea) ? a.biarea : null,
          tomtarea: isFiniteNum(a?.tomtarea) ? a.tomtarea : null,
          constructionYear: isFiniteNum(a?.constructionYear) ? a.constructionYear : null,
          meta: a?.metrics?.meta ?? undefined,
          sourceUrls: a?.metrics?.sourceUrls ?? undefined,
          media: a?.metrics?.media ?? undefined,
          hemnetStats: a?.metrics?.hemnetStats ?? undefined,
        } as any;

        if (existing) {
          await ctx.db.patch(existing._id, { ...doc, updatedAt: now });
        } else {
          await ctx.db.insert("accommodations", { ...doc, createdAt: now, updatedAt: now });
        }
        accUpserts++;
      }
    }

    if (Array.isArray(places)) {
      for (const p of places) {
        const clientId = String(p?.id ?? p?.clientId ?? "");
        if (!clientId) continue;
        const existing = await ctx.db
          .query("places")
          .withIndex("by_user_client", (q) => q.eq("userId", userId).eq("clientId", clientId))
          .unique();
        const doc = {
          userId,
          clientId,
          label: p?.label ?? null,
          address: p?.address ?? null,
          icon: p?.icon ?? null,
          arriveBy: p?.arriveBy ?? null,
          leaveAt: p?.leaveAt ?? null,
        } as any;
        if (existing) {
          await ctx.db.patch(existing._id, { ...doc, updatedAt: now });
        } else {
          await ctx.db.insert("places", { ...doc, createdAt: now, updatedAt: now });
        }
        placeUpserts++;
      }
    }

    let financeUpserted = false;
    if (finance && typeof finance === "object") {
      const rows = await ctx.db.query("finance_settings").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
      const doc = {
        userId,
        downPaymentRate: isFiniteNum(finance.downPaymentRate) ? finance.downPaymentRate : 0.15,
        interestRateAnnual: isFiniteNum(finance.interestRateAnnual) ? finance.interestRateAnnual : 0.03,
        incomeMonthlyPerson1: isFiniteNum(finance.incomeMonthlyPerson1) ? finance.incomeMonthlyPerson1 : undefined,
        incomeMonthlyPerson2: isFiniteNum(finance.incomeMonthlyPerson2) ? finance.incomeMonthlyPerson2 : undefined,
      } as any;
      if (rows[0]) await ctx.db.patch(rows[0]._id, { ...doc, updatedAt: now });
      else await ctx.db.insert("finance_settings", { ...doc, createdAt: now, updatedAt: now });
      financeUpserted = true;
    }

    let prefsUpserted = false;
    if (prefs != null) {
      const rows = await ctx.db.query("user_prefs").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
      if (rows[0]) await ctx.db.patch(rows[0]._id, { cardConfig: prefs, updatedAt: now });
      else await ctx.db.insert("user_prefs", { userId, cardConfig: prefs, createdAt: now, updatedAt: now });
      prefsUpserted = true;
    }

    return { accUpserts, placeUpserts, financeUpserted, prefsUpserted };
  },
});

function isFiniteNum(n: any): n is number {
  return typeof n === "number" && Number.isFinite(n);
}


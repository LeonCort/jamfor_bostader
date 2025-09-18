import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    userId: v.string(), // Clerk user id
    email: v.optional(v.string()),
    displayName: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  accommodations: defineTable({
    userId: v.string(),
    clientId: v.string(), // local client id to help migration
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
    currentValuation: v.optional(v.number()),
    mortgage: v.optional(v.object({ loans: v.array(v.object({ principal: v.number(), interestRateAnnual: v.number() })) })),
    meta: v.optional(
      v.object({
        type: v.optional(v.string()),
        tenure: v.optional(v.string()),
        energyClass: v.optional(v.string()),
      })
    ),
    sourceUrls: v.optional(v.object({ hemnet: v.optional(v.string()), realtor: v.optional(v.string()) })),
    media: v.optional(v.object({ images: v.array(v.string()), floorPlans: v.array(v.string()) })),
    hemnetStats: v.optional(
      v.object({ daysOnHemnet: v.optional(v.number()), timesViewed: v.optional(v.number()), labels: v.array(v.string()) })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]).index("by_user_client", ["userId", "clientId"]),

  places: defineTable({
    userId: v.string(),
    clientId: v.string(),
    label: v.optional(v.string()),
    address: v.optional(v.string()),
    icon: v.optional(v.string()),
    arriveBy: v.optional(v.string()), // HH:MM
    leaveAt: v.optional(v.string()),  // HH:MM
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]).index("by_user_client", ["userId", "clientId"]),

  finance_settings: defineTable({
    userId: v.string(),
    downPaymentRate: v.number(),
    interestRateAnnual: v.number(),
    incomeMonthlyPerson1: v.optional(v.number()),
    incomeMonthlyPerson2: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]).searchIndex("by_user_unique", { searchField: "userId" }),

  user_prefs: defineTable({
    userId: v.string(),
    cardConfig: v.any(), // store as-is for now
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]).searchIndex("by_user_unique", { searchField: "userId" }),

  commute_results: defineTable({
    userId: v.string(),
    accommodationId: v.id("accommodations"),
    placeId: v.id("places"),
    mode: v.union(v.literal("transit"), v.literal("driving"), v.literal("bicycling")),
    minutes: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_apm", ["userId", "accommodationId", "placeId", "mode"]) // unique logical key
    .index("by_user", ["userId"]),
});


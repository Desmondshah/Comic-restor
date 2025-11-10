/**
 * Convex database schema for Comic Restoration
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  jobs: defineTable({
    status: v.string(), // "pending", "processing", "completed", "failed"
    fileId: v.string(), // Convex storage ID
    options: v.object({
      scale: v.optional(v.number()),
      dpi: v.optional(v.number()),
      faceEnhance: v.optional(v.boolean()),
      aiDamageRestoration: v.optional(v.boolean()),
      matteCompensation: v.optional(v.number()),
    }),
    progress: v.optional(v.number()),
    result: v.optional(v.object({
      outputFileId: v.optional(v.string()),
      url: v.optional(v.string()),
    })),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_created_at", ["createdAt"]),
});

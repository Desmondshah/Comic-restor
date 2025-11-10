/**
 * Convex database schema for Comic Restoration
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  jobs: defineTable({
    status: v.string(), // "pending", "processing", "completed", "failed"
    storageId: v.string(), // Convex storage ID for input image
    filename: v.string(),
    options: v.optional(v.any()), // Flexible options object
    progress: v.optional(v.number()),
    stage: v.optional(v.string()),
    result: v.optional(v.object({
      outputStorageId: v.optional(v.string()),
      url: v.optional(v.string()),
      downloadUrl: v.optional(v.string()),
    })),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_created_at", ["createdAt"])
    .index("by_status", ["status"]),
});

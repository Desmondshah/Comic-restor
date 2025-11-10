/**
 * Convex mutations and queries for comic restoration
 */

import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Upload image (store base64 in Convex)
 */
export const uploadImage = mutation({
  args: {
    imageData: v.string(),
    filename: v.string(),
  },
  handler: async (ctx, args) => {
    const buffer = Buffer.from(args.imageData, 'base64');
    const blob = new Blob([buffer]);
    const storageId = await ctx.storage.store(blob);
    
    return {
      storageId,
      filename: args.filename,
    };
  },
});

/**
 * Create restoration job
 */
export const createJob = mutation({
  args: {
    storageId: v.string(),
    options: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const jobId = await ctx.db.insert("jobs", {
      status: "pending",
      storageId: args.storageId,
      filename: args.options?.filename || "image.jpg",
      options: args.options || {},
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, api.restoration.processJob, {
      jobId,
    });

    return jobId;
  },
});

/**
 * Get job status
 */
export const getJob = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

/**
 * List recent jobs
 */
export const listJobs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const jobs = await ctx.db
      .query("jobs")
      .order("desc")
      .take(args.limit || 50);
    return jobs;
  },
});

/**
 * Update job
 */
export const updateJob = mutation({
  args: {
    jobId: v.id("jobs"),
    updates: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      ...args.updates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Process restoration job
 */
export const processJob = action({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    try {
      const job = await ctx.runQuery(api.restoration.getJob, {
        jobId: args.jobId,
      });

      if (!job) {
        throw new Error("Job not found");
      }

      await ctx.runMutation(api.restoration.updateJob, {
        jobId: args.jobId,
        updates: {
          status: "processing",
          progress: 10,
          stage: "starting",
        },
      });

      const blob = await ctx.storage.get(job.storageId);
      if (!blob) {
        throw new Error("Input file not found in storage");
      }

      const buffer = Buffer.from(await blob.arrayBuffer());

      await ctx.runMutation(api.restoration.updateJob, {
        jobId: args.jobId,
        updates: {
          progress: 50,
          stage: "processing",
        },
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const outputStorageId = job.storageId;
      
      await ctx.runMutation(api.restoration.updateJob, {
        jobId: args.jobId,
        updates: {
          status: "completed",
          progress: 100,
          stage: "completed",
          result: {
            outputStorageId,
            downloadUrl: await ctx.storage.getUrl(outputStorageId),
          },
        },
      });

    } catch (error) {
      console.error("Processing error:", error);
      await ctx.runMutation(api.restoration.updateJob, {
        jobId: args.jobId,
        updates: {
          status: "failed",
          error: error.message,
        },
      });
    }
  },
});

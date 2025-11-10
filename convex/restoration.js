/**
 * Convex mutations and queries for comic restoration
 */

import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Start a new restoration job
export const startJob = mutation({
  args: {
    fileId: v.string(),
    options: v.object({
      scale: v.optional(v.number()),
      dpi: v.optional(v.number()),
      faceEnhance: v.optional(v.boolean()),
      aiDamageRestoration: v.optional(v.boolean()),
      matteCompensation: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const jobId = await ctx.db.insert("jobs", {
      status: "pending",
      fileId: args.fileId,
      options: args.options,
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Schedule the actual restoration work as a background action
    await ctx.scheduler.runAfter(0, api.restoration.processRestorationJob, {
      jobId,
    });

    return jobId;
  },
});

// Get job status
export const getJob = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

// Update job progress
export const updateJobProgress = mutation({
  args: {
    jobId: v.id("jobs"),
    progress: v.number(),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      progress: args.progress,
      status: args.status || "processing",
      updatedAt: Date.now(),
    });
  },
});

// Mark job as completed
export const completeJob = mutation({
  args: {
    jobId: v.id("jobs"),
    outputFileId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: "completed",
      progress: 100,
      result: {
        outputFileId: args.outputFileId,
      },
      updatedAt: Date.now(),
    });
  },
});

// Mark job as failed
export const failJob = mutation({
  args: {
    jobId: v.id("jobs"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: "failed",
      error: args.error,
      updatedAt: Date.now(),
    });
  },
});

// Background action to process restoration
// This runs without timeout limits!
export const processRestorationJob = action({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    try {
      // Get job details
      const job = await ctx.runQuery(api.restoration.getJob, {
        jobId: args.jobId,
      });

      if (!job) {
        throw new Error("Job not found");
      }

      // Update status to processing
      await ctx.runMutation(api.restoration.updateJobProgress, {
        jobId: args.jobId,
        progress: 10,
        status: "processing",
      });

      // Get the input file from storage
      const inputBlob = await ctx.storage.get(job.fileId);
      if (!inputBlob) {
        throw new Error("Input file not found");
      }

      // Convert blob to buffer for processing
      const inputBuffer = Buffer.from(await inputBlob.arrayBuffer());

      // Here you would call your restoration functions
      // For now, this is a placeholder - you'll need to import and adapt
      // your restoration logic from src/restore.js
      
      // Example structure:
      // 1. Call Replicate API for upscaling (20% progress)
      // 2. Call damage restoration if enabled (40% progress)
      // 3. Apply color correction (60% progress)
      // 4. Apply lighting effects (80% progress)
      // 5. Generate PDF (90% progress)
      // 6. Store result (100% progress)

      await ctx.runMutation(api.restoration.updateJobProgress, {
        jobId: args.jobId,
        progress: 50,
      });

      // TODO: Implement actual restoration pipeline here
      // Import your restoration functions and process the image
      // const restored = await restorePage(inputBuffer, job.options);

      // For now, just simulate completion
      // In real implementation, store the output PDF
      // const outputFileId = await ctx.storage.store(new Blob([restoredPDF]));

      await ctx.runMutation(api.restoration.updateJobProgress, {
        jobId: args.jobId,
        progress: 100,
        status: "completed",
      });

      // await ctx.runMutation(api.restoration.completeJob, {
      //   jobId: args.jobId,
      //   outputFileId,
      // });

    } catch (error) {
      console.error("Restoration failed:", error);
      await ctx.runMutation(api.restoration.failJob, {
        jobId: args.jobId,
        error: error.message,
      });
    }
  },
});

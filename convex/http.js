/**
 * Convex HTTP Actions for Comic Restoration API
 * Handles file uploads, restoration jobs, and serving the web UI
 */

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Serve static files from public directory
http.route({
  path: "/",
  method: "GET",
  handler: httpAction(async () => {
    // Serve index.html
    const html = await fetch(new URL("../public/index.html", import.meta.url)).then(r => r.text());
    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  }),
});

http.route({
  path: "/app.js",
  method: "GET",
  handler: httpAction(async () => {
    const js = await fetch(new URL("../public/app.js", import.meta.url)).then(r => r.text());
    return new Response(js, {
      headers: { "Content-Type": "application/javascript" },
    });
  }),
});

// Upload endpoint
http.route({
  path: "/api/upload",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Get file from multipart form data
      const formData = await request.formData();
      const file = formData.get("file");
      
      if (!file) {
        return new Response(JSON.stringify({ error: "No file provided" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Store file in Convex storage
      const blob = await file.arrayBuffer();
      const storageId = await ctx.storage.store(new Blob([blob]));

      return new Response(JSON.stringify({
        success: true,
        fileId: storageId,
        filename: file.name,
        size: file.size,
      }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Start restoration job
http.route({
  path: "/api/restore",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      
      // Schedule background job (no timeout limits!)
      const jobId = await ctx.runMutation(api.restoration.startJob, {
        fileId: body.fileId,
        options: body.options || {},
      });

      return new Response(JSON.stringify({
        success: true,
        jobId,
        message: "Restoration job started",
      }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Get job status
http.route({
  path: "/api/jobs/:id",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const jobId = url.pathname.split('/').pop();

    try {
      const job = await ctx.runQuery(api.restoration.getJob, { jobId });
      
      if (!job) {
        return new Response(JSON.stringify({ error: "Job not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(job), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Download result
http.route({
  path: "/api/download/:fileId",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const fileId = url.pathname.split('/').pop();

    try {
      const blob = await ctx.storage.get(fileId);
      
      if (!blob) {
        return new Response("File not found", { status: 404 });
      }

      return new Response(blob, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="restored-${fileId}.pdf"`,
        },
      });
    } catch (error) {
      return new Response(error.message, { status: 500 });
    }
  }),
});

export default http;

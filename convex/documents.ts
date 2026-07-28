import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireRole } from "./lib/rbac";
import { ConvexError } from "convex/values";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);
    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    // Only logged-in users can view documents
    await requireRole(ctx, [
      "super_admin",
      "hr_director",
      "records_officer",
      "department_viewer",
    ]);
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const finalizeUpload = mutation({
  args: {
    employeeId: v.id("employees"),
    category: v.string(),
    clusterTab: v.string(),
    storageId: v.id("_storage"),
    originalFilename: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);

    const id = await ctx.db.insert("documents", {
      employeeId: args.employeeId,
      category: args.category,
      clusterTab: args.clusterTab,
      storageId: args.storageId,
      originalFilename: args.originalFilename,
      uploadedBy: user._id,
      uploadedAt: Date.now(),
      status: "uploaded",
    });

    await ctx.db.insert("auditLog", {
      userId: user._id,
      userName: user.name,
      action: "document.upload",
      recordType: "documents",
      recordId: id,
      timestamp: Date.now(),
      details: { category: args.category },
    });

    return id;
  },
});

export const verify = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["super_admin", "hr_director"]);
    
    const doc = await ctx.db.get(args.documentId);
    if (!doc) throw new ConvexError("Document not found");

    await ctx.db.patch(args.documentId, {
      status: "verified",
      verifiedBy: user._id,
      verifiedAt: Date.now(),
    });

    await ctx.db.insert("auditLog", {
      userId: user._id,
      userName: user.name,
      action: "document.verify",
      recordType: "documents",
      recordId: args.documentId,
      timestamp: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: { documentId: v.id("documents"), status: v.union(v.literal("not_uploaded"), v.literal("uploaded"), v.literal("verified")) },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["super_admin", "hr_director"]);
    
    await ctx.db.patch(args.documentId, {
      status: args.status,
    });
  },
});

export const listByEmployee = query({
  args: { employeeId: v.id("employees") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [
      "super_admin",
      "hr_director",
      "records_officer",
      "department_viewer",
    ]);

    const docs = await ctx.db
      .query("documents")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
      .collect();

    return docs;
  },
});

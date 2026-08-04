import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireRole } from "./lib/rbac";
import { ConvexError } from "convex/values";
import { audited } from "./lib/audit";

// Keep in sync with src/lib/documentCategories.ts — these categories hold
// one canonical document per employee, regardless of which screen the
// upload comes from (employee record or the digitization queue).
const SINGLE_UPLOAD_CATEGORIES = ["02_Birth_Certificate", "05_National_ID", "07_KRA_PIN", "06_Confirmation_PandP"];

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
    return audited(ctx, { action: "document.upload", recordType: "documents" }, async () => {
      const user = await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);

      if (SINGLE_UPLOAD_CATEGORIES.includes(args.category)) {
        const existing = await ctx.db
          .query("documents")
          .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
          .filter((q) => q.eq(q.field("category"), args.category))
          .first();
        if (existing) {
          throw new ConvexError(
            "This employee already has a document on file for this category. Delete the existing one first to upload a replacement."
          );
        }
      }

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

      return { result: id, recordId: id, details: { category: args.category } };
    });
  },
});

export const verify = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    return audited(ctx, { action: "document.verify", recordType: "documents", recordId: args.documentId }, async () => {
      const user = await requireRole(ctx, ["super_admin", "hr_director"]);

      const doc = await ctx.db.get(args.documentId);
      if (!doc) throw new ConvexError("Document not found");

      await ctx.db.patch(args.documentId, {
        status: "verified",
        verifiedBy: user._id,
        verifiedAt: Date.now(),
      });

      return { result: null };
    });
  },
});

export const remove = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    return audited(ctx, { action: "document.remove", recordType: "documents", recordId: args.documentId }, async () => {
      await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);

      const doc = await ctx.db.get(args.documentId);
      if (!doc) throw new ConvexError("Document not found");

      if (doc.storageId) {
        await ctx.storage.delete(doc.storageId);
      }
      await ctx.db.delete(args.documentId);

      return { result: null, details: { category: doc.category, filename: doc.originalFilename } };
    });
  },
});

export const updateStatus = mutation({
  args: { documentId: v.id("documents"), status: v.union(v.literal("not_uploaded"), v.literal("uploaded"), v.literal("verified")) },
  handler: async (ctx, args) => {
    return audited(ctx, { action: "document.updateStatus", recordType: "documents", recordId: args.documentId }, async () => {
      await requireRole(ctx, ["super_admin", "hr_director"]);

      const doc = await ctx.db.get(args.documentId);
      if (!doc) throw new ConvexError("Document not found");

      await ctx.db.patch(args.documentId, {
        status: args.status,
      });

      return { result: null, details: { fromStatus: doc.status, toStatus: args.status } };
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

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);

    // No cap — a big digitization push can easily exceed the old 50-doc
    // limit, which was silently hiding older pending docs from the queue.
    const docs = await ctx.db
      .query("documents")
      .withIndex("by_status", (q) => q.eq("status", "uploaded"))
      .order("desc")
      .collect();

    const withEmployeeNames = await Promise.all(
      docs.map(async (doc) => {
        const employee = await ctx.db.get(doc.employeeId);
        return { ...doc, employeeName: employee?.fullName ?? "Unknown" };
      })
    );

    return withEmployeeNames;
  },
});

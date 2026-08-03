import { mutation, query, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireRole } from "./lib/rbac";

const VIEW_ROLES = ["super_admin", "hr_director", "records_officer", "department_viewer"];
const MANAGE_ROLES = ["super_admin", "hr_director", "records_officer"];

export const list = query({
  handler: async (ctx) => {
    await requireRole(ctx, VIEW_ROLES);

    const templates = await ctx.db.query("performanceTemplates").order("desc").collect();
    return await Promise.all(
      templates.map(async (t) => ({
        ...t,
        url: await ctx.storage.getUrl(t.storageId),
      }))
    );
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    await requireRole(ctx, MANAGE_ROLES);
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, MANAGE_ROLES);

    const id = await ctx.db.insert("performanceTemplates", {
      title: args.title,
      storageId: args.storageId,
      uploadedBy: user._id,
      uploadedAt: Date.now(),
    });

    await ctx.db.insert("auditLog", {
      userId: user._id,
      userName: user.name ?? "Unknown",
      action: "performanceTemplate.create",
      recordType: "performanceTemplates",
      recordId: id,
      timestamp: Date.now(),
      details: { title: args.title },
    });

    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("performanceTemplates") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, MANAGE_ROLES);

    const template = await ctx.db.get(args.id);
    if (!template) throw new ConvexError("Template not found");

    await ctx.storage.delete(template.storageId);
    await ctx.db.delete(args.id);

    await ctx.db.insert("auditLog", {
      userId: user._id,
      userName: user.name ?? "Unknown",
      action: "performanceTemplate.remove",
      recordType: "performanceTemplates",
      recordId: args.id,
      timestamp: Date.now(),
      details: { title: template.title },
    });
  },
});

// Unauthenticated helpers for one-off seeding from the CLI (`npx convex run`),
// mirroring the seed.ts bootstrap pattern since there's no logged-in user in
// that context.
export const seedGenerateUploadUrl = internalMutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const seedCreate = internalMutation({
  args: {
    title: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("performanceTemplates", {
      title: args.title,
      storageId: args.storageId,
      uploadedAt: Date.now(),
    });
  },
});

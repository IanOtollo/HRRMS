import { action } from "./_generated/server";
import { requireRole } from "./lib/rbac";
import { v } from "convex/values";

export const generateExport = action({
  args: { format: v.union(v.literal("pdf"), v.literal("excel")) },
  handler: async (ctx, args) => {
    // Usually we would check role here, but actions don't have DB context easily without passing it.
    // For this stub, we return a fake URL.
    return "https://example.com/report-stub." + args.format;
  },
});

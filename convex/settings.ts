import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireRole, getCurrentUser } from "./lib/rbac";
import { audited } from "./lib/audit";

const DEFAULTS = {
  enforceMfa: false,
  ipWhitelistEnabled: false,
  allowedIpRanges: "",
};

export const get = query({
  args: {},
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    const existing = await ctx.db.query("systemSettings").first();
    return existing ?? { ...DEFAULTS, updatedAt: 0 };
  },
});

export const update = mutation({
  args: {
    enforceMfa: v.boolean(),
    ipWhitelistEnabled: v.boolean(),
    allowedIpRanges: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return audited(ctx, { action: "settings.update", recordType: "systemSettings" }, async () => {
      const user = await requireRole(ctx, ["super_admin"]);

      const existing = await ctx.db.query("systemSettings").first();
      const patch = {
        enforceMfa: args.enforceMfa,
        ipWhitelistEnabled: args.ipWhitelistEnabled,
        allowedIpRanges: args.allowedIpRanges,
        updatedBy: user._id,
        updatedAt: Date.now(),
      };

      if (existing) {
        await ctx.db.patch(existing._id, patch);
      } else {
        await ctx.db.insert("systemSettings", patch);
      }

      return {
        result: null,
        details: {
          fromEnforceMfa: existing?.enforceMfa,
          toEnforceMfa: args.enforceMfa,
          fromIpWhitelistEnabled: existing?.ipWhitelistEnabled,
          toIpWhitelistEnabled: args.ipWhitelistEnabled,
        },
      };
    });
  },
});

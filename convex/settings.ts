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
    // Deliberately projected — siteBlocked*/ictPin are never returned by any
    // query reachable from a regular logged-in user.
    return {
      enforceMfa: existing?.enforceMfa ?? DEFAULTS.enforceMfa,
      ipWhitelistEnabled: existing?.ipWhitelistEnabled ?? DEFAULTS.ipWhitelistEnabled,
      allowedIpRanges: existing?.allowedIpRanges ?? DEFAULTS.allowedIpRanges,
      updatedAt: existing?.updatedAt ?? 0,
    };
  },
});

// Public and unauthenticated on purpose — every visitor, logged in or not,
// needs to know whether the site is under maintenance before anything else
// loads. Returns nothing beyond the blocked flag and ICT's stated reason.
export const getSiteBlockStatus = query({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("systemSettings").first();
    return {
      blocked: existing?.siteBlocked ?? false,
      reason: existing?.siteBlockedReason ?? "",
    };
  },
});

export const setSiteBlock = mutation({
  args: {
    blocked: v.boolean(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return audited(ctx, { action: "settings.setSiteBlock", recordType: "systemSettings" }, async () => {
      const user = await requireRole(ctx, ["ict_support"]);

      const existing = await ctx.db.query("systemSettings").first();
      const patch = {
        siteBlocked: args.blocked,
        siteBlockedReason: args.blocked ? args.reason ?? "" : undefined,
        siteBlockedAt: args.blocked ? Date.now() : undefined,
        siteBlockedBy: args.blocked ? user._id : undefined,
      };

      if (existing) {
        await ctx.db.patch(existing._id, patch);
      } else {
        await ctx.db.insert("systemSettings", { ...DEFAULTS, updatedAt: Date.now(), ...patch });
      }

      return { result: null, details: { blocked: args.blocked, reason: args.reason } };
    });
  },
});

// The PIN is a UX friction layer on /ict, not the real security boundary —
// requireRole(ict_support) below (and on every actual ICT mutation) is.
export const verifyIctPin = mutation({
  args: { pin: v.string() },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["ict_support"]);
    const existing = await ctx.db.query("systemSettings").first();
    const storedPin = existing?.ictPin ?? "1234";
    return args.pin === storedPin;
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

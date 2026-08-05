import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { createAccount } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// One-time bootstrap for the first super_admin account, since there is no
// public signup page (accounts are admin-provisioned from the Roles page
// once a super_admin exists). Run once via:
//   npx convex run seed:bootstrapAdmin '{"email":"...","password":"...","name":"..."}'
export const bootstrapAdmin = internalAction({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.runQuery(internal.seed.hasSuperAdmin, {});
    if (existing) {
      throw new Error(
        "A super_admin account already exists. Refusing to create another via bootstrap."
      );
    }

    const { user } = await createAccount(ctx, {
      provider: "password",
      account: { id: args.email, secret: args.password },
      profile: {
        email: args.email,
        name: args.name,
        role: "super_admin",
        isActive: true,
        createdAt: Date.now(),
      },
    });

    return { userId: user._id };
  },
});

// Admin utility for renaming a user's display name (used when provisioning
// or relabeling seeded accounts). Run via:
//   npx convex run seed:renameUserByEmail '{"email":"...","name":"..."}'
export const renameUserByEmail = internalMutation({
  args: { email: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .unique();
    if (!user) throw new Error(`No user found with email ${args.email}`);
    await ctx.db.patch(user._id, { name: args.name });
  },
});

const RBAC_ROSTER: { email: string; name: string; role: "super_admin" | "ict_support" | "records_officer" }[] = [
  { email: "director.hr@busiacounty.go.ke", name: "Director of HR", role: "super_admin" },
  { email: "deputy.hr@busiacounty.go.ke", name: "Deputy Director of HR", role: "super_admin" },
  { email: "ict.hr@busiacounty.go.ke", name: "ICT Support", role: "ict_support" },
  { email: "record.hr@busiacounty.go.ke", name: "Records Officer", role: "records_officer" },
];

// One-time provisioning of the standard RBAC roster (director/deputy HR,
// ICT Support, Records Officer). Does not touch any pre-existing account —
// idempotent per email, so re-running only creates whichever are missing.
// Passwords are the intentionally simple "123456", changeable afterward via
// Settings > Change Password.
//   npx convex run seed:seedRbacRoster
export const seedRbacRoster = internalAction({
  args: {},
  handler: async (ctx) => {
    const results: { email: string; status: "created" | "already exists" }[] = [];
    for (const account of RBAC_ROSTER) {
      const existing = await ctx.runQuery(internal.seed.findUserByEmail, { email: account.email });
      if (existing) {
        results.push({ email: account.email, status: "already exists" });
        continue;
      }
      await createAccount(ctx, {
        provider: "password",
        account: { id: account.email, secret: "123456" },
        profile: {
          email: account.email,
          name: account.name,
          role: account.role,
          isActive: true,
          createdAt: Date.now(),
        },
      });
      results.push({ email: account.email, status: "created" });
    }
    return results;
  },
});

export const findUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .unique();
  },
});

export const hasSuperAdmin = internalQuery({
  args: {},
  handler: async (ctx) => {
    const admin = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "super_admin"))
      .first();
    return admin !== null;
  },
});

const BUSIA_DEPARTMENTS: { name: string; code: string }[] = [
  { name: "Smart Agriculture, Livestock, Fisheries, Blue Economy and Agribusiness", code: "AGRICULTURE" },
  { name: "Trade, Investment, Industrialisation, Cooperatives, Small and Micro Enterprises (SME)", code: "TRADE_SME" },
  { name: "Education and Industrial Skills Development", code: "EDUCATION" },
  { name: "County Treasury and Economic Planning", code: "TREASURY" },
  { name: "Youth, Sports, Culture, Gender and Creative Arts", code: "YOUTH_ARTS" },
  { name: "Transport, Roads and Public Works", code: "TRANSPORT" },
  { name: "Public Service Management (PSM)", code: "PSM" },
  { name: "Lands, Housing and Urban Development", code: "LANDS_HOUSING" },
  { name: "Water, Environment, Irrigation, Natural Resources and Climate Change", code: "WATER_CLIMATE" },
  { name: "Health Services and Sanitation", code: "HEALTH" },
  { name: "Strategic Partnership, ICT and Digital Economy", code: "ICT" },
  { name: "County Public Service Board", code: "CPSB" },
  { name: "County Law Office", code: "LAW_OFFICE" },
  { name: "County Assembly", code: "ASSEMBLY" },
  { name: "Governorship", code: "GOVERNORSHIP" },
];

// Idempotent: run via `npx convex run seed:seedDepartments`
export const seedDepartments = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("departments").collect();
    const existingCodes = new Set(existing.map((d) => d.code));

    let inserted = 0;
    for (const dept of BUSIA_DEPARTMENTS) {
      if (!existingCodes.has(dept.code)) {
        await ctx.db.insert("departments", dept);
        inserted++;
      }
    }

    return { inserted, alreadyPresent: existing.length };
  },
});

// One-time data migration: normalizes employee records created before
// nextOfKin became an array (up to 3 entries) and accountNumber was
// dropped from bankDetails (now managed by the payroll system, not HR).
// Run via: npx convex run seed:migrateFamilyFields
export const migrateFamilyFields = internalMutation({
  args: {},
  handler: async (ctx) => {
    const employees = await ctx.db.query("employees").collect();
    let migrated = 0;

    for (const emp of employees) {
      const patch: Record<string, unknown> = {};
      let needsPatch = false;

      if (emp.nextOfKin && !Array.isArray(emp.nextOfKin)) {
        patch.nextOfKin = [emp.nextOfKin];
        needsPatch = true;
      }

      if (emp.bankDetails && "accountNumber" in emp.bankDetails) {
        patch.bankDetails = {
          bankName: emp.bankDetails.bankName,
          branchName: emp.bankDetails.branchName,
        };
        needsPatch = true;
      }

      if (needsPatch) {
        await ctx.db.patch(emp._id, patch);
        migrated++;
      }
    }

    return { migrated, total: employees.length };
  },
});

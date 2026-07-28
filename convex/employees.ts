import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireRole, requireDepartmentScope } from "./lib/rbac";
import { Id } from "./_generated/dataModel";

export const list = query({
  args: {
    searchTerm: v.optional(v.string()),
    departmentId: v.optional(v.id("departments")),
    employmentStatus: v.optional(v.string()),
    jobGroup: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [
      "super_admin",
      "hr_director",
      "records_officer",
      "department_viewer",
    ]);

    let q = ctx.db.query("employees");
    
    // Department viewer can only see their own department
    const effectiveDepartmentId =
      user.role === "department_viewer" ? user.departmentId : args.departmentId;

    let results;
    if (effectiveDepartmentId) {
      results = await ctx.db.query("employees")
        .withIndex("by_department", (q) =>
          q.eq("departmentId", effectiveDepartmentId)
        ).take(100);
    } else {
      results = await ctx.db.query("employees").order("desc").take(100);
    }

    if (args.employmentStatus) {
      results = results.filter((r) => r.employmentStatus === args.employmentStatus);
    }

    if (args.jobGroup) {
      results = results.filter((r) => r.jobGroup === args.jobGroup);
    }

    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      results = results.filter(
        (r) =>
          r.fullName.toLowerCase().includes(term) ||
          r.pfNumber.toLowerCase().includes(term) ||
          r.nationalId.toLowerCase().includes(term)
      );
    }

    // Mask sensitive data for non-admins
    if (user.role === "records_officer" || user.role === "department_viewer") {
      results = results.map((r) => {
        const maskedBankDetails = r.bankDetails ? {
          bankName: r.bankDetails.bankName,
          branchName: r.bankDetails.branchName,
          accountNumber: `***${r.bankDetails.accountNumber.slice(-4)}`
        } : undefined;
        return {
          ...r,
          nationalId: `***${r.nationalId.slice(-4)}`,
          bankDetails: maskedBankDetails,
        };
      });
    }

    return results;
  },
});

import { ConvexError } from "convex/values";

export const get = query({
  args: { id: v.id("employees") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [
      "super_admin",
      "hr_director",
      "records_officer",
      "department_viewer",
    ]);

    const employee = await ctx.db.get(args.id);
    if (!employee) return null;

    if (user.role === "department_viewer") {
      await requireDepartmentScope(ctx, user, employee.departmentId as unknown as Id<"departments">);
    }

    // Masking
    if (user.role !== "super_admin" && user.role !== "hr_director") {
      const maskedBankDetails = employee.bankDetails ? {
        bankName: employee.bankDetails.bankName,
        branchName: employee.bankDetails.branchName,
        accountNumber: `***${employee.bankDetails.accountNumber.slice(-4)}`
      } : undefined;
      return {
        ...employee,
        nationalId: `***${employee.nationalId.slice(-4)}`,
        bankDetails: maskedBankDetails,
      };
    }

    return employee;
  },
});

export const create = mutation({
  args: {
    fullName: v.string(),
    pfNumber: v.string(),
    nationalId: v.string(),
    departmentId: v.string(),
    designation: v.string(),
    employmentStatus: v.union(
      v.literal("active"),
      v.literal("on_leave"),
      v.literal("suspended"),
      v.literal("retired"),
      v.literal("terminated")
    ),
    termsOfService: v.string(),
    firstAppointmentDate: v.string(),
    retirementDate: v.string(),
    
    // Expanded Profile Fields
    payrollNumber: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("Male"), v.literal("Female"), v.literal("Other"))),
    phoneNumber: v.optional(v.string()),
    emailAddress: v.optional(v.string()),
    passportPhotoId: v.optional(v.id("_storage")),
    supervisorId: v.optional(v.id("employees")),
    stationLocation: v.string(),

    // Statutory Information
    shifNhifNumber: v.optional(v.string()),
    nssfNumber: v.optional(v.string()),
    bankDetails: v.optional(v.object({
      bankName: v.string(),
      branchName: v.string(),
      accountNumber: v.string(),
    })),
    saccoInformation: v.optional(v.string()),

    // Family Information
    nextOfKin: v.optional(v.object({
      name: v.string(),
      relationship: v.string(),
      phoneNumber: v.string(),
    })),
    emergencyContact: v.optional(v.object({
      name: v.string(),
      relationship: v.string(),
      phoneNumber: v.string(),
    })),
    dependants: v.optional(v.array(
      v.object({
        name: v.string(),
        relationship: v.string(),
        dateOfBirth: v.string(),
      })
    )),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);
    
    const id = await ctx.db.insert("employees", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("auditLog", {
      userId: user._id,
      userName: user.name,
      action: "employee.create",
      recordType: "employees",
      recordId: id,
      timestamp: Date.now(),
      details: { pfNumber: args.pfNumber },
    });

    return id;
  },
});

export const updateField = mutation({
  args: {
    id: v.id("employees"),
    field: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);
    const employee = await ctx.db.get(args.id);
    
    if (!employee) throw new ConvexError("Employee not found");

    if (user.role === "records_officer" && args.field === "employmentStatus") {
      throw new ConvexError("Records Officer cannot change employment status");
    }

    await ctx.db.patch(args.id, {
      [args.field]: args.value,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("auditLog", {
      userId: user._id,
      userName: user.name,
      action: "employee.updateField",
      recordType: "employees",
      recordId: args.id,
      timestamp: Date.now(),
      details: { field: args.field },
    });
  },
});


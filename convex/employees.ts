import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireRole, requireDepartmentScope } from "./lib/rbac";
import { audited } from "./lib/audit";

// County service has no minors — enforced here as well as in the UI, since
// a direct API call could otherwise skip the frontend's validation.
function ageAt(dobStr: string, asOfStr: string): number {
  const dob = new Date(dobStr);
  const asOf = new Date(asOfStr);
  let age = asOf.getFullYear() - dob.getFullYear();
  const monthDiff = asOf.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

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

    // No cap here — this list is used for search/filter/pickers across the
    // whole app, so capping it silently hides employees created before the
    // cutoff instead of just being a performance tradeoff.
    let results;
    if (effectiveDepartmentId) {
      results = await ctx.db.query("employees")
        .withIndex("by_department", (q) =>
          q.eq("departmentId", effectiveDepartmentId)
        ).collect();
    } else {
      results = await ctx.db.query("employees").order("desc").collect();
    }

    if (args.employmentStatus) {
      results = results.filter((r) => r.employmentStatus === args.employmentStatus);
    }

    if (args.jobGroup) {
      results = results.filter((r) => r.jobGroup === args.jobGroup);
    }

    const term = args.searchTerm?.trim().toLowerCase();
    if (term) {
      results = results.filter(
        (r) =>
          r.fullName.toLowerCase().includes(term) ||
          r.pfNumber.toLowerCase().includes(term) ||
          r.nationalId.toLowerCase().includes(term)
      );
    }

    // Mask sensitive data for non-admins
    if (user.role === "records_officer" || user.role === "department_viewer") {
      results = results.map((r) => ({
        ...r,
        nationalId: `***${r.nationalId.slice(-4)}`,
      }));
    }

    return results;
  },
});

const UNIQUE_FIELD_INDEX = {
  pfNumber: "by_pf",
  nationalId: "by_national_id",
  phoneNumber: "by_phone",
  emailAddress: "by_email",
} as const;

// Real-time "is this already taken" check for the four unique fields, used
// to flag a clash the moment it's typed rather than only on submit.
export const checkFieldAvailable = query({
  args: {
    field: v.union(
      v.literal("pfNumber"),
      v.literal("nationalId"),
      v.literal("phoneNumber"),
      v.literal("emailAddress")
    ),
    value: v.string(),
    excludeId: v.optional(v.id("employees")),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);

    const value = args.value.trim();
    if (!value) return { available: true };

    // Using .collect() instead of .unique() here — legacy/seed data may
    // already contain duplicates, and this check must never crash on that;
    // it only needs to know whether any *other* employee holds this value.
    const index = UNIQUE_FIELD_INDEX[args.field];
    const matches = await ctx.db
      .query("employees")
      .withIndex(index, (q) => q.eq(args.field as never, value))
      .collect();

    const conflict = matches.find((m) => m._id !== args.excludeId);
    return { available: !conflict };
  },
});

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
      await requireDepartmentScope(ctx, user, employee.departmentId);
    }

    // Masking
    if (user.role !== "super_admin" && user.role !== "hr_director") {
      return {
        ...employee,
        nationalId: `***${employee.nationalId.slice(-4)}`,
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
    departmentId: v.id("departments"),
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
    contractEndDate: v.optional(v.string()),
    jobGroup: v.optional(v.string()),

    // Expanded Profile Fields
    payrollNumber: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("Male"), v.literal("Female"))),
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
    })),
    saccoInformation: v.optional(v.string()),

    // Family Information — up to 5 next of kin, doubling as the emergency
    // contact list surfaced from the employee master record.
    nextOfKin: v.optional(v.array(
      v.object({
        name: v.string(),
        relationship: v.string(),
        phoneNumber: v.string(),
      })
    )),
    dependants: v.optional(v.array(
      v.object({
        name: v.string(),
        relationship: v.string(),
        dateOfBirth: v.string(),
      })
    )),
  },
  handler: async (ctx, args) => {
    return audited(ctx, { action: "employee.create", recordType: "employees" }, async () => {
      await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);

      const today = new Date().toISOString().slice(0, 10);
      if (args.dateOfBirth) {
        if (args.dateOfBirth > today) {
          throw new ConvexError("Date of birth cannot be in the future");
        }
        if (ageAt(args.dateOfBirth, args.firstAppointmentDate) < 18) {
          throw new ConvexError("Employee must have been at least 18 years old on the date of appointment");
        }
      }

      const pfClash = await ctx.db
        .query("employees")
        .withIndex("by_pf", (q) => q.eq("pfNumber", args.pfNumber))
        .first();
      if (pfClash) {
        throw new ConvexError(`P/F Number ${args.pfNumber} is already assigned to another employee`);
      }

      const idClash = await ctx.db
        .query("employees")
        .withIndex("by_national_id", (q) => q.eq("nationalId", args.nationalId))
        .first();
      if (idClash) {
        throw new ConvexError(`National ID ${args.nationalId} is already assigned to another employee`);
      }

      if (args.phoneNumber) {
        const phoneClash = await ctx.db
          .query("employees")
          .withIndex("by_phone", (q) => q.eq("phoneNumber", args.phoneNumber))
          .first();
        if (phoneClash) {
          throw new ConvexError(`Phone number ${args.phoneNumber} is already assigned to another employee`);
        }
      }

      if (args.emailAddress) {
        const emailClash = await ctx.db
          .query("employees")
          .withIndex("by_email", (q) => q.eq("emailAddress", args.emailAddress))
          .first();
        if (emailClash) {
          throw new ConvexError(`Email address ${args.emailAddress} is already assigned to another employee`);
        }
      }

      const id = await ctx.db.insert("employees", {
        ...args,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return { result: id, recordId: id, details: { pfNumber: args.pfNumber } };
    });
  },
});

export const updateField = mutation({
  args: {
    id: v.id("employees"),
    field: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    return audited(ctx, { action: "employee.updateField", recordType: "employees", recordId: args.id }, async () => {
      const user = await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);
      const employee = await ctx.db.get(args.id);

      if (!employee) throw new ConvexError("Employee not found");

      if (user.role === "records_officer" && args.field === "employmentStatus") {
        throw new ConvexError("Records Officer cannot change employment status");
      }

      const uniqueFieldChecks: Record<string, { index: "by_pf" | "by_national_id" | "by_phone" | "by_email"; label: string }> = {
        pfNumber: { index: "by_pf", label: "P/F Number" },
        nationalId: { index: "by_national_id", label: "National ID" },
        phoneNumber: { index: "by_phone", label: "Phone number" },
        emailAddress: { index: "by_email", label: "Email address" },
      };
      const check = uniqueFieldChecks[args.field];
      if (check && args.value) {
        const matches = await ctx.db
          .query("employees")
          .withIndex(check.index, (q) => q.eq(args.field as never, args.value))
          .collect();
        if (matches.some((m) => m._id !== args.id)) {
          throw new ConvexError(`${check.label} ${args.value} is already assigned to another employee`);
        }
      }

      if (args.field === "dateOfBirth" || args.field === "firstAppointmentDate") {
        const dob = args.field === "dateOfBirth" ? args.value : employee.dateOfBirth;
        const appointmentDate = args.field === "firstAppointmentDate" ? args.value : employee.firstAppointmentDate;
        const today = new Date().toISOString().slice(0, 10);
        if (dob) {
          if (dob > today) {
            throw new ConvexError("Date of birth cannot be in the future");
          }
          if (appointmentDate && ageAt(dob, appointmentDate) < 18) {
            throw new ConvexError("Employee must have been at least 18 years old on the date of appointment");
          }
        }
      }

      const oldValue = (employee as Record<string, unknown>)[args.field];

      await ctx.db.patch(args.id, {
        [args.field]: args.value,
        updatedAt: Date.now(),
      });

      return { result: null, details: { field: args.field, oldValue, newValue: args.value } };
    });
  },
});

export const removePhoto = mutation({
  args: { id: v.id("employees") },
  handler: async (ctx, args) => {
    return audited(ctx, { action: "employee.removePhoto", recordType: "employees", recordId: args.id }, async () => {
      await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);
      const employee = await ctx.db.get(args.id);
      if (!employee) throw new ConvexError("Employee not found");

      if (employee.passportPhotoId) {
        await ctx.storage.delete(employee.passportPhotoId);
      }

      await ctx.db.patch(args.id, {
        passportPhotoId: undefined,
        updatedAt: Date.now(),
      });

      return { result: null };
    });
  },
});

// Renews a Casual/Contract employee's contract, reactivating their record if
// it had gone dormant on the previous contract's expiry. Permanent &
// Pensionable retirement is final and does not go through this path.
export const renewContract = mutation({
  args: {
    id: v.id("employees"),
    newContractEndDate: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return audited(ctx, { action: "employee.renewContract", recordType: "employees", recordId: args.id }, async () => {
      await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);

      const employee = await ctx.db.get(args.id);
      if (!employee) throw new ConvexError("Employee not found");

      if (employee.termsOfService !== "Contract" && employee.termsOfService !== "Casual") {
        throw new ConvexError("Only Casual or Contract employees can have their contract renewed");
      }

      const today = new Date().toISOString().slice(0, 10);
      if (args.newContractEndDate <= today) {
        throw new ConvexError("New contract end date must be in the future");
      }

      const previousEndDate = employee.contractEndDate;

      await ctx.db.patch(args.id, {
        contractEndDate: args.newContractEndDate,
        employmentStatus: "active",
        updatedAt: Date.now(),
      });

      return { result: null, details: { previousEndDate, newEndDate: args.newContractEndDate, note: args.note } };
    });
  },
});


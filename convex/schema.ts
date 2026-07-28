import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    role: v.union(
      v.literal("super_admin"),
      v.literal("hr_director"),
      v.literal("records_officer"),
      v.literal("department_viewer")
    ),
    departmentId: v.optional(v.id("departments")),
    isActive: v.boolean(),
    createdAt: v.number(),
    lastLoginAt: v.optional(v.number()),
  }).index("by_email", ["email"]),

  departments: defineTable({
    name: v.string(),
    code: v.string(),
  }),

  employees: defineTable({
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
    jobGroup: v.optional(v.string()),
    
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .searchIndex("search_all", {
      searchField: "fullName",
      filterFields: ["departmentId", "employmentStatus", "jobGroup"],
    })
    .index("by_pf", ["pfNumber"])
    .index("by_national_id", ["nationalId"])
    .index("by_department", ["departmentId"]),

  documents: defineTable({
    employeeId: v.id("employees"),
    category: v.string(),
    clusterTab: v.string(),
    storageId: v.optional(v.id("_storage")),
    originalFilename: v.string(),
    uploadedBy: v.id("users"),
    uploadedAt: v.number(),
    status: v.union(
      v.literal("not_uploaded"),
      v.literal("uploaded"),
      v.literal("verified")
    ),
    verifiedBy: v.optional(v.id("users")),
    verifiedAt: v.optional(v.number()),
  })
    .index("by_employee", ["employeeId"])
    .index("by_status", ["status"]),

  leaveRecords: defineTable({
    employeeId: v.id("employees"),
    leaveType: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    daysCount: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    approvedBy: v.optional(v.id("users")),
    documentIds: v.array(v.id("documents")),
  }).index("by_employee", ["employeeId"]),

  leaveBalances: defineTable({
    employeeId: v.id("employees"),
    year: v.number(),
    annualBalance: v.number(),
    sickBalance: v.number(),
    daysTakenYtd: v.number(),
  }).index("by_employee_year", ["employeeId", "year"]),

  appraisals: defineTable({
    employeeId: v.id("employees"),
    cycleLabel: v.string(),
    status: v.string(),
    documentId: v.optional(v.id("documents")),
    submittedAt: v.number(),
  }).index("by_employee", ["employeeId"]),

  trainingRecords: defineTable({
    employeeId: v.id("employees"),
    trainingTitle: v.string(),
    nominationDate: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    attendanceConfirmed: v.boolean(),
    documentIds: v.array(v.id("documents")),
  }).index("by_employee", ["employeeId"]),

  disciplinaryRecords: defineTable({
    employeeId: v.id("employees"),
    caseReference: v.string(),
    stage: v.union(
      v.literal("warning"),
      v.literal("show_cause"),
      v.literal("interdiction"),
      v.literal("committee_decision"),
      v.literal("closed")
    ),
    openedAt: v.number(),
    closedAt: v.optional(v.number()),
    documentIds: v.array(v.id("documents")),
    restrictedNotes: v.optional(v.string()),
  }).index("by_employee", ["employeeId"]),

  exitRecords: defineTable({
    employeeId: v.id("employees"),
    exitType: v.union(
      v.literal("retirement"),
      v.literal("resignation"),
      v.literal("termination")
    ),
    stage: v.union(
      v.literal("notice_filed"),
      v.literal("clearance"),
      v.literal("exit_interview"),
      v.literal("finalized")
    ),
    noticeDate: v.string(),
    finalizedDate: v.optional(v.string()),
    documentIds: v.array(v.id("documents")),
  }).index("by_employee", ["employeeId"]),

  auditLog: defineTable({
    userId: v.id("users"),
    userName: v.string(),
    action: v.string(),
    recordType: v.string(),
    recordId: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    timestamp: v.number(),
    details: v.optional(v.any()),
  }).index("by_timestamp", ["timestamp"]),

  notifications: defineTable({
    userId: v.id("users"),
    message: v.string(),
    linkPath: v.string(),
    isRead: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  otps: defineTable({
    email: v.string(),
    otp: v.string(),
    expiresAt: v.number(),
  }).index("by_email", ["email"]),
});

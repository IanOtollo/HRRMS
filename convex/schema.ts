import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const userRoleValidator = v.union(
  v.literal("super_admin"),
  v.literal("hr_director"),
  v.literal("records_officer"),
  v.literal("department_viewer")
);

export default defineSchema({
  ...authTables,

  // Extends the base Convex Auth `users` table (name, email, phone, image,
  // emailVerificationTime, phoneVerificationTime, isAnonymous) with our
  // application-specific profile fields. Credentials themselves live in
  // Convex Auth's own `authAccounts` table, not here.
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),

    role: v.optional(userRoleValidator),
    departmentId: v.optional(v.id("departments")),
    isActive: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
    lastLoginAt: v.optional(v.number()),
  }).index("email", ["email"]),

  departments: defineTable({
    name: v.string(),
    code: v.string(),
  }),

  employees: defineTable({
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
    // Only meaningful for Casual/Contract employees — the current contract's
    // expiry, renewed via employees.renewContract as terms are extended.
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

    // Family Information — up to 3 next of kin (optional), also used as the
    // emergency-contact list shown from the employee master record.
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
    // Permanently set once an employee has a second disciplinary case
    // opened (regardless of that case's outcome) — never auto-cleared.
    isBlacklisted: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .searchIndex("search_all", {
      searchField: "fullName",
      filterFields: ["departmentId", "employmentStatus", "jobGroup"],
    })
    .index("by_pf", ["pfNumber"])
    .index("by_national_id", ["nationalId"])
    .index("by_department", ["departmentId"])
    .index("by_phone", ["phoneNumber"])
    .index("by_email", ["emailAddress"]),

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

  // Digital equivalent of the CG/SPA appraisal forms: Form 3 (agreed
  // performance targets & achievements) and Form 5 (individual work plan)
  // are keyed in per employee per cycle; MPMC/CIPMC recommendation is the
  // per-officer line item that rolls up into CG/SPA Form 4.
  appraisals: defineTable({
    employeeId: v.id("employees"),
    cycleLabel: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("submitted"),
      v.literal("completed")
    ),
    score: v.optional(v.number()),
    comments: v.optional(v.string()),
    documentId: v.optional(v.id("documents")),
    submittedAt: v.number(),

    // CG/SPA Form 3 — Agreed Performance Targets & Achievements
    targets: v.optional(v.array(v.object({
      target: v.string(),
      achievement: v.string(),
    }))),
    additionalAssignments: v.optional(v.array(v.string())),

    // CG/SPA Form 5 — Individual Work Plan
    workPlanPeriod: v.optional(v.string()),
    workPlan: v.optional(v.array(v.object({
      directorateObjective: v.string(),
      individualTargets: v.string(),
      keyActivities: v.string(),
      resourcesRequired: v.string(),
      performanceIndicators: v.string(),
      timeFrame: v.string(),
    }))),

    // CG/SPA Form 4 — per-officer line feeding the Recommendation to CEC
    mpmcRecommendation: v.optional(v.string()),
    mpmcRemarks: v.optional(v.string()),
  }).index("by_employee", ["employeeId"]),

  trainingRecords: defineTable({
    employeeId: v.id("employees"),
    trainingTitle: v.string(),
    institution: v.optional(v.string()),
    nominationDate: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    attendanceConfirmed: v.boolean(),
    notes: v.optional(v.string()),
    documentIds: v.array(v.id("documents")),
    // Undefined means the application is still on its originally scheduled
    // dates. "discarded" withdraws it; "deferred" marks it as rescheduled
    // (startDate/endDate hold the new dates) so the change is visible.
    status: v.optional(v.union(v.literal("discarded"), v.literal("deferred"))),
    discardReason: v.optional(v.string()),
  }).index("by_employee", ["employeeId"]),

  // Follows the County Public Service Board disciplinary procedure: receipt
  // & preliminary inquiry, investigation, show cause/hearing, interdiction
  // or suspension, and board determination — guided throughout by natural
  // justice and fair administrative action.
  disciplinaryRecords: defineTable({
    employeeId: v.id("employees"),
    caseReference: v.string(),
    stage: v.union(
      v.literal("preliminary_inquiry"),
      v.literal("investigation"),
      v.literal("show_cause"),
      v.literal("interdiction_suspension"),
      v.literal("board_determination"),
      v.literal("closed")
    ),
    // Which of the two applies during the interdiction_suspension stage —
    // interdiction (half pay, pending investigation) vs suspension (no pay,
    // pending dismissal of a convicted/culpable officer).
    interdictionType: v.optional(v.union(v.literal("interdiction"), v.literal("suspension"))),
    // The Board's determination — set on reaching board_determination or closed.
    outcome: v.optional(v.union(
      v.literal("no_further_action"),
      v.literal("reprimand"),
      v.literal("salary_stoppage"),
      v.literal("dismissal"),
      v.literal("retirement_public_interest")
    )),
    openedAt: v.number(),
    closedAt: v.optional(v.number()),
    documentIds: v.array(v.id("documents")),
    restrictedNotes: v.optional(v.string()),
  }).index("by_employee", ["employeeId"]),

  // Exit types follow the legal grounds for leaving Kenyan county public
  // service: mandatory age retirement, resignation, ill health, abolition
  // of office, retirement in the public interest, contract expiry,
  // disciplinary dismissal, and death in service.
  exitRecords: defineTable({
    employeeId: v.id("employees"),
    exitType: v.union(
      v.literal("retirement_age"),
      v.literal("resignation"),
      v.literal("ill_health"),
      v.literal("abolition_of_office"),
      v.literal("public_interest"),
      v.literal("contract_expiry"),
      v.literal("dismissal"),
      v.literal("death")
    ),
    stage: v.union(
      v.literal("notice_filed"),
      v.literal("clearance"),
      v.literal("exit_interview"),
      v.literal("finalized")
    ),
    noticeDate: v.string(),
    finalizedDate: v.optional(v.string()),
    notes: v.optional(v.string()),
    documentIds: v.array(v.id("documents")),
  }).index("by_employee", ["employeeId"]),

  auditLog: defineTable({
    // Optional because a failed login attempt (wrong password, or an email
    // that matches no account) has no authenticated user to attribute it to.
    userId: v.optional(v.id("users")),
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

  systemSettings: defineTable({
    enforceMfa: v.boolean(),
    ipWhitelistEnabled: v.boolean(),
    allowedIpRanges: v.optional(v.string()),
    updatedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
  }),

});

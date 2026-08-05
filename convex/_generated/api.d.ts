/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as appraisals from "../appraisals.js";
import type * as auditLog from "../auditLog.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as cronsLogic from "../cronsLogic.js";
import type * as departments from "../departments.js";
import type * as disciplinaryRecords from "../disciplinaryRecords.js";
import type * as documents from "../documents.js";
import type * as employees from "../employees.js";
import type * as exitRecords from "../exitRecords.js";
import type * as http from "../http.js";
import type * as leaveRecords from "../leaveRecords.js";
import type * as lib_audit from "../lib/audit.js";
import type * as lib_rbac from "../lib/rbac.js";
import type * as notifications from "../notifications.js";
import type * as otp from "../otp.js";
import type * as otpNode from "../otpNode.js";
import type * as reports from "../reports.js";
import type * as seed from "../seed.js";
import type * as settings from "../settings.js";
import type * as tickets from "../tickets.js";
import type * as trainingRecords from "../trainingRecords.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  appraisals: typeof appraisals;
  auditLog: typeof auditLog;
  auth: typeof auth;
  crons: typeof crons;
  cronsLogic: typeof cronsLogic;
  departments: typeof departments;
  disciplinaryRecords: typeof disciplinaryRecords;
  documents: typeof documents;
  employees: typeof employees;
  exitRecords: typeof exitRecords;
  http: typeof http;
  leaveRecords: typeof leaveRecords;
  "lib/audit": typeof lib_audit;
  "lib/rbac": typeof lib_rbac;
  notifications: typeof notifications;
  otp: typeof otp;
  otpNode: typeof otpNode;
  reports: typeof reports;
  seed: typeof seed;
  settings: typeof settings;
  tickets: typeof tickets;
  trainingRecords: typeof trainingRecords;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

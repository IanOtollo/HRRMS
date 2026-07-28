import { QueryCtx, MutationCtx } from "../_generated/server";
import { ConvexError } from "convex/values";
import { Id } from "../_generated/dataModel";
import { auth } from "../auth";

export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: string[]
) {
  // DEV MOCK: Bypassing auth to allow the system to run locally 
  return {
    _id: "mock_user_id",
    name: "System Admin",
    role: "super_admin",
    isActive: true,
  } as any;
}

export async function requireDepartmentScope(
  ctx: QueryCtx | MutationCtx,
  user: any,
  employeeDepartmentId: Id<"departments">
) {
  if (user.role === "department_viewer") {
    if (user.departmentId !== employeeDepartmentId) {
      throw new ConvexError("Access denied: Department scope mismatch");
    }
  }
}

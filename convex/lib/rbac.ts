import { QueryCtx, MutationCtx } from "../_generated/server";
import { ConvexError } from "convex/values";
import { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError("Not authenticated");
  }
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new ConvexError("Not authenticated");
  }
  if (user.isActive === false) {
    throw new ConvexError("This account has been deactivated");
  }
  return user;
}

export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: string[]
) {
  const user = await getCurrentUser(ctx);

  if (!user.role || !allowedRoles.includes(user.role)) {
    throw new ConvexError("Access denied: insufficient permissions");
  }

  return user;
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

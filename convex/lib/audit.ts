import { MutationCtx } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

// Resolved independently of each mutation's own requireRole() call, so a
// permission-denied attempt is still attributed to the right person instead
// of falling back to "Unknown" — identity and authorization are separate
// questions here.
async function resolveActor(ctx: MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return { userId: undefined, userName: "Unauthenticated" };
  const user = await ctx.db.get(userId);
  if (!user) return { userId, userName: "Unknown" };
  return { userId, userName: user.name ?? user.email ?? "Unknown" };
}

export function toErrorMessage(err: unknown): string {
  if (err instanceof ConvexError) {
    return typeof err.data === "string" ? err.data : JSON.stringify(err.data);
  }
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

type AuditMeta = {
  action: string;
  recordType: string;
  recordId?: string;
};

type AuditOutcome<T> = {
  result: T;
  recordId?: string;
  details?: unknown;
};

// Wraps a mutation's core logic: logs one "success" auditLog row on the way
// out, or one "error" row (with the thrown message) if it throws — then
// rethrows so the caller's error handling/UI toast is unaffected.
export async function audited<T>(
  ctx: MutationCtx,
  meta: AuditMeta,
  fn: () => Promise<AuditOutcome<T>>
): Promise<T> {
  const actor = await resolveActor(ctx);
  try {
    const { result, recordId, details } = await fn();
    await ctx.db.insert("auditLog", {
      ...actor,
      action: meta.action,
      recordType: meta.recordType,
      recordId: recordId ?? meta.recordId,
      status: "success",
      details,
      timestamp: Date.now(),
    });
    return result;
  } catch (err) {
    await ctx.db.insert("auditLog", {
      ...actor,
      action: meta.action,
      recordType: meta.recordType,
      recordId: meta.recordId,
      status: "error",
      errorMessage: toErrorMessage(err),
      timestamp: Date.now(),
    });
    throw err;
  }
}

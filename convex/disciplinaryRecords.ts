import { query } from "./_generated/server";
import { requireRole } from "./lib/rbac";

export const list = query({
  handler: async (ctx) => {
    // Department viewer has NO access to disciplinary records
    const user = await requireRole(ctx, [
      "super_admin",
      "hr_director",
      "records_officer",
    ]);

    const records = await ctx.db.query("disciplinaryRecords").collect();

    // Records officer cannot see restricted notes
    if (user.role === "records_officer") {
      return records.map((r) => {
        const { restrictedNotes, ...rest } = r;
        return rest;
      });
    }

    return records;
  },
});

import { internalMutation } from "./_generated/server";

export const dailyChecks = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
    
    // Find HR Directors to notify
    const hrDirectors = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "hr_director"))
      .collect();

    // 1. Retirement Reminders
    const employees = await ctx.db.query("employees").collect();
    for (const emp of employees) {
      if (emp.retirementDate) {
        const retirementMs = new Date(emp.retirementDate).getTime();
        if (retirementMs - now > 0 && retirementMs - now <= sixtyDaysMs) {
          for (const hr of hrDirectors) {
            await ctx.db.insert("notifications", {
              userId: hr._id,
              message: `Employee ${emp.fullName} (${emp.pfNumber}) is approaching retirement on ${emp.retirementDate}.`,
              linkPath: `/employees/${emp._id}`,
              isRead: false,
              createdAt: now,
            });
          }
        }
      }
    }

    // 2. Unverified Documents older than 7 days
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const pendingDocs = await ctx.db
      .query("documents")
      .withIndex("by_status", (q) => q.eq("status", "uploaded"))
      .collect();

    let oldDocsCount = 0;
    for (const doc of pendingDocs) {
      if (now - doc.uploadedAt > sevenDaysMs) {
        oldDocsCount++;
      }
    }

    if (oldDocsCount > 0) {
      for (const hr of hrDirectors) {
        await ctx.db.insert("notifications", {
          userId: hr._id,
          message: `${oldDocsCount} document(s) have been pending verification for over 7 days.`,
          linkPath: `/digitization-queue`,
          isRead: false,
          createdAt: now,
        });
      }
    }
  },
});

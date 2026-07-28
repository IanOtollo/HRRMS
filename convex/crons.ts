import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Schedule a daily job at midnight (UTC)
crons.daily(
  "daily flags and reminders",
  { hourUTC: 0, minuteUTC: 0 },
  internal.cronsLogic.dailyChecks
);

export default crons;

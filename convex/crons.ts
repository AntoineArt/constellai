import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalAction, v } from "./_generated/server";

const crons = cronJobs();

crons.cron("daily model rate sync", { hourUTC: 2, minuteUTC: 0 }, internal.index.syncModelRates, {});
crons.cron("postpaid cycle close", { hourUTC: 3, minuteUTC: 0 }, internal.index.closePostpaidCycles, {});

export default crons;



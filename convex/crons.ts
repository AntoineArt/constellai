import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalAction, v } from "./_generated/server";

const crons = cronJobs();

crons.cron("daily model rate sync", { hourUTC: 2, minuteUTC: 0 }, internal.index.syncModelRates, {});

export default crons;



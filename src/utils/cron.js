// src/utils/cron.js
const cron = require("node-cron");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * @description This function finds all active leases where the expiry date
 * has passed and updates them to be inactive.
 */
const deactivateExpiredLeases = async () => {
  console.log(
    `[Scheduler] Running job: Deactivating expired leases at ${new Date().toISOString()}`
  );
  const now = new Date();

  try {
    const result = await prisma.lease.updateMany({
      where: {
        isActive: true,
        AND: {
          expiryDate: {
            lt: now,
          },
        },
      },
      data: {
        isActive: false,
      },
    });

    if (result.count > 0) {
      console.log(
        `[Scheduler] Successfully deactivated ${result.count} expired lease(s).`
      );
    } else {
      console.log("[Scheduler] No expired leases found to deactivate.");
    }
  } catch (error) {
    console.error("[Scheduler] Error during scheduled deactivation:", error);
  }
};

/**
 * @description Initializes and starts all scheduled jobs for the application.
 */
const startScheduler = () => {
  cron.schedule("0 1 * * *", deactivateExpiredLeases, {
    scheduled: true,
    timezone: "Asia/Tashkent",
  });

  console.log(
    "Scheduler started. Expired leases will be checked daily at 1:00 AM."
  );

  deactivateExpiredLeases();
};

module.exports = { startScheduler };

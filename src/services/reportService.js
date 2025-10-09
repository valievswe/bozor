// src/services/reportService.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { calculateExpectedPayment } = require("./paymentService");

// Helper function to count workdays (Mon-Sat) in a given month
function getWorkdayCount(year, month) {
  // month is 1-12
  let count = 0;
  const date = new Date(Date.UTC(year, month - 1, 1));
  while (date.getUTCMonth() === month - 1) {
    const dayOfWeek = date.getUTCDay(); // 0=Sunday
    if (dayOfWeek !== 0) {
      count++;
    }
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return count;
}

// NEW: Calculate cumulative debt for a single lease across all unpaid months
async function calculateCumulativeDebtForLease(lease, upToDate = new Date()) {
  const issueDate = new Date(lease.issueDate);
  const endDate = lease.expiryDate ? new Date(lease.expiryDate) : upToDate;
  const finalDate = endDate > upToDate ? upToDate : endDate;

  let totalDebt = 0;
  const currentDate = new Date(issueDate);
  currentDate.setDate(1); // Start from first day of issue month

  // Loop through each month from issue date to now
  while (currentDate <= finalDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // Get all PAID transactions for this specific month
    const paidTransactions = await prisma.transaction.findMany({
      where: {
        leaseId: lease.id,
        status: "PAID",
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    });

    const totalPaidThisMonth = paidTransactions.reduce(
      (sum, tx) => sum + Number(tx.amount),
      0
    );

    // Get attendance for this month (for daily payment interval)
    const attendanceCount = await prisma.attendance.count({
      where: {
        leaseId: lease.id,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    });

    // Calculate expected payment for this month
    let expectedAmount = 0;
    if (lease.paymentInterval === "MONTHLY") {
      expectedAmount =
        (Number(lease.shopMonthlyFee) || 0) +
        (Number(lease.stallMonthlyFee) || 0) +
        (Number(lease.guardFee) || 0);
    } else if (lease.paymentInterval === "DAILY") {
      const workdaysInMonth = getWorkdayCount(year, month + 1);
      const payableDays = workdaysInMonth - attendanceCount;
      const dailyFee =
        (Number(lease.shopMonthlyFee) || 0) +
        (Number(lease.stallMonthlyFee) || 0) +
        (Number(lease.guardFee) || 0);
      expectedAmount = payableDays * dailyFee;
    }

    // If paid less than expected, add difference to debt
    if (totalPaidThisMonth < expectedAmount) {
      totalDebt += expectedAmount - totalPaidThisMonth;
    }

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return totalDebt;
}

const getDailyReport = async (date) => {
  // This function is fine as it is, no changes needed.
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await prisma.transaction.aggregate({
    _sum: { amount: true },
    _count: { id: true },
    where: { status: "PAID", createdAt: { gte: startOfDay, lte: endOfDay } },
  });

  return {
    date: startOfDay.toISOString().split("T")[0],
    totalIncome: result._sum.amount || 0,
    transactionCount: result._count.id || 0,
  };
};

// --- THIS IS THE NEW, UPGRADED FUNCTION ---
const getMonthlyReport = async (year, month) => {
  // month is 1-12
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  // 1. Calculate Total Income for the month (this part is the same)
  const incomeResult = await prisma.transaction.aggregate({
    _sum: { amount: true },
    _count: { id: true },
    where: { status: "PAID", createdAt: { gte: startDate, lte: endDate } },
  });

  // 2. Calculate Total Debt for the month
  const liableLeases = await prisma.lease.findMany({
    where: {
      // Find leases that were active at any point during this month
      issueDate: { lte: endDate },
      OR: [{ expiryDate: null }, { expiryDate: { gte: startDate } }],
    },
  });

  let totalDebtForMonth = 0;
  const totalWorkdaysInMonth = getWorkdayCount(year, month);

  for (const lease of liableLeases) {
    // Get PAID transactions for THIS specific month
    const paidTransactionsThisMonth = await prisma.transaction.findMany({
      where: {
        leaseId: lease.id,
        status: "PAID",
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const totalPaidThisMonth = paidTransactionsThisMonth.reduce(
      (sum, tx) => sum + Number(tx.amount),
      0
    );

    // Get attendance count for this month
    const attendanceCount = await prisma.attendance.count({
      where: {
        leaseId: lease.id,
        date: { gte: startDate, lte: endDate },
      },
    });

    // Calculate expected amount for this month
    let expectedAmount = 0;
    if (lease.paymentInterval === "MONTHLY") {
      expectedAmount =
        (Number(lease.shopMonthlyFee) || 0) +
        (Number(lease.stallMonthlyFee) || 0) +
        (Number(lease.guardFee) || 0);
    } else if (lease.paymentInterval === "DAILY") {
      const payableDays = totalWorkdaysInMonth - attendanceCount;
      const dailyFee =
        (Number(lease.shopMonthlyFee) || 0) +
        (Number(lease.stallMonthlyFee) || 0) +
        (Number(lease.guardFee) || 0);
      expectedAmount = payableDays * dailyFee;
    }

    // If paid less than expected, add difference to debt
    if (totalPaidThisMonth < expectedAmount) {
      totalDebtForMonth += expectedAmount - totalPaidThisMonth;
    }
  }

  return {
    month: `${year}-${String(month).padStart(2, "0")}`,
    totalIncome: incomeResult._sum.amount || 0,
    totalDebt: totalDebtForMonth,
    transactionCount: incomeResult._count.id || 0,
  };
};

const getDashboardStats = async () => {
  try {
    const [
      ownerCount,
      storeCount,
      stallCount,
      activeLeaseCount,
      archivedLeaseCount,
    ] = await prisma.$transaction([
      prisma.owner.count(),
      prisma.store.count(),
      prisma.stall.count(),
      prisma.lease.count({ where: { isActive: true } }),
      prisma.lease.count({ where: { isActive: false } }),
    ]);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // This is 0-11 for Date object creation

    const currentMonthForHelper = currentMonth + 1;

    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
    const endOfCurrentMonth = new Date(
      currentYear,
      currentMonth + 1,
      0,
      23,
      59,
      59,
      999
    );

    const liableLeasesThisMonth = await prisma.lease.findMany({
      where: {
        OR: [
          { isActive: true },
          { isActive: false, updatedAt: { gte: startOfCurrentMonth } },
        ],
        issueDate: { lte: endOfCurrentMonth },
      },
    });

    // Calculate income for current month
    const incomeTransactions = await prisma.transaction.findMany({
      where: {
        status: "PAID",
        createdAt: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
      },
    });

    let monthlyIncome = incomeTransactions.reduce(
      (sum, tx) => sum + Number(tx.amount),
      0
    );

    let totalDebt = 0;
    const overdueLeasesData = [];

    // Calculate CUMULATIVE debt for each lease (not just current month!)
    for (const lease of liableLeasesThisMonth) {
      const cumulativeDebt = await calculateCumulativeDebtForLease(lease, now);

      if (cumulativeDebt > 0) {
        totalDebt += cumulativeDebt;

        // Add to overdue list (top 5)
        if (overdueLeasesData.length < 5) {
          const owner = await prisma.owner.findUnique({
            where: { id: lease.ownerId },
            select: { fullName: true },
          });
          const store = lease.storeId
            ? await prisma.store.findUnique({
                where: { id: lease.storeId },
                select: { storeNumber: true },
              })
            : null;
          const stall = lease.stallId
            ? await prisma.stall.findUnique({
                where: { id: lease.stallId },
                select: { stallNumber: true },
              })
            : null;
          overdueLeasesData.push({
            ...lease,
            owner,
            store,
            stall,
            debt: cumulativeDebt,
          });
        }
      }
    }

    const monthlyChartData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1; // 1-12
      const reportData = await getMonthlyReport(year, month);
      monthlyChartData.push({
        month: new Date(year, month - 1).toLocaleString("default", {
          month: "short",
          year: "2-digit",
        }),
        income: reportData.totalIncome,
        debt: reportData.totalDebt,
      });
    }

    const recentTransactions = await prisma.transaction.findMany({
      where: { status: "PAID" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        lease: { include: { owner: true, store: true, stall: true } },
      },
    });

    return {
      keyMetrics: {
        totalOwners: ownerCount,
        totalAssets: storeCount + stallCount,
        activeLeases: activeLeaseCount,
        archivedLeases: archivedLeaseCount,
        totalDebt: totalDebt,
        monthlyIncome: monthlyIncome,
      },
      chartData: monthlyChartData,
      recentTransactions,
      overdueLeases: overdueLeasesData,
    };
  } catch (error) {
    console.error("CRITICAL ERROR in getDashboardStats:", error);
    throw new Error("Failed to get dashboard stats due to an internal error.");
  }
};

module.exports = {
  getDailyReport,
  getMonthlyReport,
  getDashboardStats,
  calculateCumulativeDebtForLease,
};

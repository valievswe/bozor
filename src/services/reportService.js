// src/services/reportService.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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

  // 2. Calculate Total Debt for the month (this is the new logic)
  const liableLeases = await prisma.lease.findMany({
    where: {
      // Find leases that were active at any point during this month
      issueDate: { lte: endDate },
      OR: [{ expiryDate: null }, { expiryDate: { gte: startDate } }],
    },
    include: {
      transactions: { where: { createdAt: { gte: startDate, lte: endDate } } },
      attendance: { where: { date: { gte: startDate, lte: endDate } } },
    },
  });

  let totalDebtForMonth = 0;
  const totalWorkdaysInMonth = getWorkdayCount(year, month);

  for (const lease of liableLeases) {
    // Only calculate debt if there were no paid transactions in that month
    if (lease.transactions.length === 0) {
      let leaseDebt = 0;
      if (lease.paymentInterval === "MONTHLY") {
        leaseDebt =
          (Number(lease.shopMonthlyFee) || 0) +
          (Number(lease.stallMonthlyFee) || 0) +
          (Number(lease.guardFee) || 0);
      } else if (lease.paymentInterval === "DAILY") {
        const absenceCount = lease.attendance.length;
        const payableDays = totalWorkdaysInMonth - absenceCount;
        const dailyFee =
          (Number(lease.shopMonthlyFee) || 0) +
          (Number(lease.stallMonthlyFee) || 0) +
          (Number(lease.guardFee) || 0);
        leaseDebt = payableDays * dailyFee;
      }
      totalDebtForMonth += leaseDebt;
    }
  }

  return {
    month: `${year}-${String(month).padStart(2, "0")}`,
    totalIncome: incomeResult._sum.amount || 0,
    totalDebt: totalDebtForMonth,
    transactionCount: incomeResult._count.id || 0,
  };
};

// --- getDashboardStats is also updated to use the helper function correctly ---
const getDashboardStats = async () => {
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
  const currentMonth = now.getMonth(); // This is 0-11 for Date object
  const currentMonthForHelper = now.getMonth() + 1; // This is 1-12 for our helper

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
    include: {
      transactions: {
        where: { status: "PAID", createdAt: { gte: startOfCurrentMonth } },
      },
      attendance: {
        where: { date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth } },
      },
    },
  });

  let totalDebt = 0;
  let monthlyIncome = 0;
  const overdueLeasesData = [];
  const totalWorkdaysInMonth = getWorkdayCount(
    currentYear,
    currentMonthForHelper
  );

  for (const lease of liableLeasesThisMonth) {
    if (lease.transactions.length > 0) {
      lease.transactions.forEach((tx) => {
        monthlyIncome += Number(tx.amount);
      });
    }

    if (lease.transactions.length === 0) {
      let leaseDebt = 0;
      if (lease.paymentInterval === "MONTHLY") {
        leaseDebt =
          (Number(lease.shopMonthlyFee) || 0) +
          (Number(lease.stallMonthlyFee) || 0) +
          (Number(lease.guardFee) || 0);
      } else if (lease.paymentInterval === "DAILY") {
        const absenceCount = lease.attendance.length;
        const payableDays = totalWorkdaysInMonth - absenceCount;
        const dailyFee =
          (Number(lease.shopMonthlyFee) || 0) +
          (Number(lease.stallMonthlyFee) || 0) +
          (Number(lease.guardFee) || 0);
        leaseDebt = payableDays * dailyFee;
      }
      totalDebt += leaseDebt;

      if (leaseDebt > 0 && overdueLeasesData.length < 5) {
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
        overdueLeasesData.push({ ...lease, owner, store, stall });
      }
    }
  }

  // --- CHART DATA CALCULATION ---
  // This part can also be improved to use the new getMonthlyReport function for accuracy
  const monthlyChartData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const month = d.getMonth() + 1; // 1-12

    // Call our new, accurate report function
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

  // --- RECENT TRANSACTIONS ---
  const recentTransactions = await prisma.transaction.findMany({
    where: { status: "PAID" },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { lease: { include: { owner: true, store: true, stall: true } } },
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
};

module.exports = {
  getDailyReport,
  getMonthlyReport,
  getDashboardStats,
};

// src/services/reportService.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getDailyReport = async (date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await prisma.transaction.aggregate({
    _sum: { amount: true },
    _count: { id: true },
    where: {
      status: "PAID",
      createdAt: { gte: startOfDay, lte: endOfDay },
    },
  });

  return {
    date: startOfDay.toISOString().split("T")[0],
    totalIncome: result._sum.amount || 0,
    transactionCount: result._count.id || 0,
  };
};

const getMonthlyReport = async (year, month) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const result = await prisma.transaction.aggregate({
    _sum: { amount: true },
    _count: { id: true },
    where: {
      status: "PAID",
      createdAt: { gte: startDate, lte: endDate },
    },
  });

  return {
    month: `${year}-${String(month).padStart(2, "0")}`,
    totalIncome: result._sum.amount || 0,
    transactionCount: result._count.id || 0,
  };
};

const getDashboardStats = async () => {
  const [ownerCount, storeCount, activeLeaseCount, archivedLeaseCount] =
    await prisma.$transaction([
      prisma.owner.count(),
      prisma.store.count(),
      prisma.lease.count({ where: { isActive: true } }),
      prisma.lease.count({ where: { isActive: false } }),
    ]);

  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfCurrentMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  // --- ACCURATE DEBT & INCOME CALCULATION FOR CURRENT MONTH ---
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
    },
  });

  let totalDebt = 0;
  let monthlyIncome = 0;
  const overdueLeasesData = [];

  for (const lease of liableLeasesThisMonth) {
    if (lease.transactions.length === 0) {
      const totalFee =
        (Number(lease.shopMonthlyFee) || 0) +
        (Number(lease.stallMonthlyFee) || 0) +
        (Number(lease.guardFee) || 0);
      totalDebt += totalFee;
      if (overdueLeasesData.length < 5) {
        // Manually add owner and store info for the list
        const owner = await prisma.owner.findUnique({
          where: { id: lease.ownerId },
          select: { fullName: true },
        });
        const store = await prisma.store.findUnique({
          where: { id: lease.storeId },
          select: { storeNumber: true },
        });
        overdueLeasesData.push({ ...lease, owner, store });
      }
    } else {
      lease.transactions.forEach((tx) => {
        monthlyIncome += Number(tx.amount);
      });
    }
  }

  // --- CHART DATA CALCULATION ---
  const monthlyChartData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const month = d.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const incomeResult = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        status: "PAID",
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    // Simplified debt calculation for past months for performance
    const debtResult = await prisma.lease.aggregate({
      _sum: { shopMonthlyFee: true, stallMonthlyFee: true, guardFee: true },
      where: {
        isActive: true, // For past months, we simplify by looking at currently active leases
        transactions: {
          none: {
            createdAt: { gte: startOfMonth, lte: endOfMonth },
          },
        },
      },
    });

    monthlyChartData.push({
      month: startOfMonth.toLocaleString("default", {
        month: "short",
        year: "2-digit",
      }),
      income: incomeResult._sum.amount || 0,
      debt:
        (Number(debtResult._sum.shopMonthlyFee) || 0) +
        (Number(debtResult._sum.stallMonthlyFee) || 0) +
        (Number(debtResult._sum.guardFee) || 0),
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
      totalAssets: storeCount + (await prisma.stall.count()), // Added stalls count
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

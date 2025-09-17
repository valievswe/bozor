// src/services/exportService.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const xlsx = require("xlsx");

const exportLeasesToExcel = async () => {
  // 1. Fetch data (no changes)
  const leases = await prisma.lease.findMany({
    where: { isActive: true },
    include: {
      owner: true,
      store: true,
      stall: true,
      transactions: {
        where: { status: "PAID" },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 2. Process data (no changes)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const dataForSheet = leases.map((lease) => {
    let paymentStatus = "To'lanmagan";
    if (lease.transactions.length > 0) {
      const lastPaymentDate = new Date(lease.transactions[0].createdAt);
      if (
        lastPaymentDate.getFullYear() === currentYear &&
        lastPaymentDate.getMonth() === currentMonth
      ) {
        paymentStatus = "To'langan";
      }
    }
    const assetName =
      lease.store?.storeNumber || lease.stall?.stallNumber || "N/A";
    const totalFee =
      (Number(lease.shopMonthlyFee) || 0) +
      (Number(lease.stallMonthlyFee) || 0) +
      (Number(lease.guardFee) || 0);
    return {
      "Shartnoma ID": lease.id,
      "Mulkdor F.I.Sh.": lease.owner.fullName,
      "STIR (INN)": lease.owner.tin,
      "Obyekt Raqami": assetName,
      "Oylik To'lov (so'm)": totalFee,
      "Hozirgi Oy To'lov Holati": paymentStatus,
      "Shartnoma Muddati": lease.expiryDate
        ? new Date(lease.expiryDate).toLocaleDateString("uz-UZ")
        : "Muddatsiz",
    };
  });

  // 3. Create workbook (no changes)
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.json_to_sheet(dataForSheet);
  worksheet["!cols"] = [
    { wch: 15 },
    { wch: 35 },
    { wch: 20 },
    { wch: 15 },
    { wch: 20 },
    { wch: 25 },
    { wch: 20 },
  ];
  xlsx.utils.book_append_sheet(workbook, worksheet, "Faol Ijaralar");

  const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

  return buffer;
};

module.exports = {
  exportLeasesToExcel,
};

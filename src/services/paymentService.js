const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();
const axios = require("axios");

const calculateExpectedPayment = (lease, attendanceCount = 0) => {
  const totalFee =
    (Number(lease.shopMonthlyFee) || 0) +
    (Number(lease.stallMonthlyFee) || 0) +
    (Number(lease.guardFee) || 0);

  if (lease.paymentInterval === "DAILY") {
    let workdays = 0;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = new Date(year, month, 1);

    while (date.getMonth() === month) {
      if (date.getDay() !== 0) workdays++;
      date.setDate(date.getDate() + 1);
    }

    const payableDays = workdays - attendanceCount;
    return totalFee * payableDays;
  }

  return totalFee;
};

const calculateLeasePaymentStatus = (lease, attendanceCount = 0) => {
  if (!lease || !lease.transactions) return "UNPAID";

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const expectedAmount = calculateExpectedPayment(lease, attendanceCount);
  const totalPaidThisMonth = lease.transactions
    .filter((tx) => {
      const txDate = new Date(tx.createdAt);
      return (
        txDate.getFullYear() === currentYear &&
        txDate.getMonth() === currentMonth
      );
    })
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  if (totalPaidThisMonth >= expectedAmount) return "PAID";
  if (totalPaidThisMonth > 0 && totalPaidThisMonth < expectedAmount)
    return "PARTIALLY_PAID";
  return "UNPAID";
};

const getLeaseForPayment = async (leaseId) => {
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId, isActive: true },
    include: {
      owner: { select: { fullName: true } },
      store: { select: { storeNumber: true } },
      stall: { select: { stallNumber: true } },
      transactions: {
        where: { status: { in: ["PAID", "PARTIAL_PAID"] } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!lease) throw new Error("Faol ijara shartnomasi topilmadi.");

  const totalFee =
    (Number(lease.shopMonthlyFee) || 0) +
    (Number(lease.stallMonthlyFee) || 0) +
    (Number(lease.guardFee) || 0);

  return {
    id: lease.id,
    ownerName: lease.owner.fullName,
    storeNumber: lease.store?.storeNumber,
    stallNumber: lease.stall?.stallNumber,
    totalFee,
    paymentInterval: lease.paymentInterval,
    paymentStatus: calculateLeasePaymentStatus(lease),
    transactions: lease.transactions,
  };
};

const initiatePayment = async (leaseId, amount, payment_method = "CLICK") => {
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId, isActive: true },
    include: {
      store: { select: { id: true, storeNumber: true, kassaID: true } },
      stall: { select: { id: true, stallNumber: true } },
      transactions: {
        where: { status: { in: ["PAID", "PARTIAL_PAID"] } },
        orderBy: { createdAt: "desc" },
      },
      attendance: true,
    },
  });

  if (!lease) throw new Error("Faol ijara shartnomasi topilmadi.");

  const attendanceCount = lease.attendance?.length || 0;
  const expectedAmount = calculateExpectedPayment(lease, attendanceCount);

  const totalPaidThisMonth = lease.transactions
    .filter((tx) => {
      const txDate = new Date(tx.createdAt);
      return (
        txDate.getFullYear() === new Date().getFullYear() &&
        txDate.getMonth() === new Date().getMonth()
      );
    })
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const remainingAmount = expectedAmount - totalPaidThisMonth;

  if (remainingAmount <= 0)
    throw new Error("To‘lov allaqachon to‘liq amalga oshirilgan.");

  if (Number(amount) > remainingAmount) {
    throw new Error(
      `To‘lov summasi ortiqcha. Qolgan to‘lov: ${remainingAmount} UZS`
    );
  }

  const paymentType =
    Number(amount) === remainingAmount ? "FULL_PAID" : "PARTIAL_PAID";

  await prisma.transaction.deleteMany({
    where: { leaseId, status: "PENDING" },
  });

  const transaction = await prisma.transaction.create({
    data: {
      amount: new Prisma.Decimal(amount),
      status: "PENDING",
      leaseId,
      paymentMethod: payment_method,
      paymentType,
    },
  });

  let storageId;
  if (lease.storeId && lease.store) {
    const kassaId = lease.store.kassaID;
    storageId = !isNaN(kassaId) ? parseInt(kassaId, 10) : kassaId;
  } else if (lease.stallId && lease.stall) {
    storageId = lease.stall.stallNumber || `STALL_${lease.stallId}`;
  }

  if (!storageId)
    throw new Error("Lease is not associated with a valid store or stall.");

  try {
    const payload = {
      tenant_id: process.env.TENANT_ID,
      storage_id: parseInt(storageId, 10),
      lease_id: lease.id,
      amount: parseInt(amount, 10),
      payment_method: payment_method.toLowerCase(),
    };

    const headers = {
      "Content-Type": "application/json",
      "X-Webhook-Secret": process.env.CENTRAL_PAYMENT_SERVICE_SECRET,
    };

    const response = await axios.post(
      `${process.env.CENTRAL_PAYMENT_SERVICE_URL}/payment/transactions/create`,
      payload,
      { headers }
    );

    if (!response.data?.payme_link)
      throw new Error("Invalid response from payment service");

    return {
      checkoutUrl: response.data[linkField],
      transactionId: transaction.id,
      paymentType,
      remainingAmount,
    };
  } catch (error) {
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "FAILED" },
    });
    throw new Error("To‘lov xizmati vaqtincha ishlamayapti.");
  }
};

const getLeasePaymentSummary = async (leaseId) => {
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId, isActive: true },
    include: {
      transactions: {
        where: { status: { in: ["PAID", "PARTIAL_PAID"] } },
        orderBy: { createdAt: "asc" },
      },
      attendance: true,
    },
  });

  if (!lease) throw new Error("Faol ijara shartnomasi topilmadi.");

  const isDaily = lease.paymentInterval === "DAILY";
  const totalMonthlyFee =
    (Number(lease.shopMonthlyFee) || 0) +
    (Number(lease.stallMonthlyFee) || 0) +
    (Number(lease.guardFee) || 0);

  const startDate = new Date(lease.issueDate);
  const endDate = new Date(lease.expiryDate);

  const summary = [];
  let totalPaid = 0;
  let totalDebt = 0;

  let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  while (current <= endDate) {
    const month = current.getMonth();
    const year = current.getFullYear();

    let expectedAmount = totalMonthlyFee;

    if (isDaily) {
      let workdays = 0;
      const date = new Date(year, month, 1);
      while (date.getMonth() === month) {
        if (date.getDay() !== 0) workdays++;
        date.setDate(date.getDate() + 1);
      }

      const attendanceCount = lease.attendance.filter((a) => {
        const d = new Date(a.date);
        return d.getFullYear() === year && d.getMonth() === month;
      }).length;

      expectedAmount *= workdays - attendanceCount;
    }

    const paid = lease.transactions
      .filter((tx) => {
        const d = new Date(tx.createdAt);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    totalPaid += paid;
    const debt = Math.max(expectedAmount - paid, 0);
    totalDebt += debt;

    summary.push({
      month: current.toLocaleString("default", {
        month: "long",
        year: "numeric",
      }),
      expected: expectedAmount,
      paid,
      debt,
    });

    current.setMonth(current.getMonth() + 1);
  }

  return {
    summary,
    totalPaid,
    totalDebt,
  };
};

module.exports = {
  getLeaseForPayment,
  initiatePayment,
  calculateLeasePaymentStatus,
  calculateExpectedPayment,
  getLeasePaymentSummary,
};

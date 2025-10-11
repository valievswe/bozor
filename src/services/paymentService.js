const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();
const axios = require("axios");

// Helper to calculate expected payment
const calculateExpectedPayment = (lease, attendanceCount = 0) => {
  const totalFee =
    (Number(lease.shopMonthlyFee) || 0) +
    (Number(lease.stallMonthlyFee) || 0) +
    (Number(lease.guardFee) || 0);

  if (lease.paymentInterval === "DAILY") {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    let workdays = 0;
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0) workdays++;
      date.setDate(date.getDate() + 1);
    }

    const payableDays = workdays - attendanceCount;
    return totalFee * payableDays;
  }

  return totalFee; // MONTHLY
};

// Calculate lease payment status
const calculateLeasePaymentStatus = (lease, attendanceCount = 0) => {
  if (!lease || !lease.transactions) return "UNPAID";

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();

  const expectedAmount = calculateExpectedPayment(lease, attendanceCount);

  if (lease.paymentInterval === "MONTHLY") {
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
  } else if (lease.paymentInterval === "DAILY") {
    const paidToday = lease.transactions.some((tx) => {
      const txDate = new Date(tx.createdAt);
      return (
        txDate.getFullYear() === currentYear &&
        txDate.getMonth() === currentMonth &&
        txDate.getDate() === currentDate
      );
    });
    if (paidToday) return "PAID";
  }

  return "UNPAID";
};

// Fetch lease details
const getLeaseForPayment = async (leaseId) => {
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId, isActive: true },
    include: {
      owner: { select: { fullName: true } },
      store: { select: { storeNumber: true } },
      stall: { select: { stallNumber: true } },
      transactions: {
        where: { status: "PAID" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!lease) throw new Error("Faol ijara shartnomasi topilmadi.");

  const totalFee =
    (Number(lease.shopMonthlyFee) || 0) +
    (Number(lease.stallMonthlyFee) || 0) +
    (Number(lease.guardFee) || 0);

  return {
    ...lease,
    totalFee,
    ownerName: lease.owner.fullName,
    storeNumber: lease.store?.storeNumber,
    stallNumber: lease.stall?.stallNumber,
    paymentStatus: calculateLeasePaymentStatus(lease),
  };
};

const initiatePayment = async (leaseId, amount, payment_method = "PAYME") => {
  console.log(`--- [PAYMENT INITIATION STARTED] ---`);
  console.log(
    `Lease ID: ${leaseId}, Amount: ${amount}, Provider: ${payment_method}`
  );

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const lease = await prisma.lease.findUnique({
    where: { id: leaseId, isActive: true },
    include: {
      store: { select: { id: true, storeNumber: true, kassaID: true } },
      stall: { select: { id: true, stallNumber: true } },
      transactions: {
        where: { status: "PAID" },
        orderBy: { createdAt: "desc" },
      },
      attendance: {
        where: {
          date: {
            gte: new Date(currentYear, currentMonth, 1),
            lt: new Date(currentYear, currentMonth + 1, 1),
          },
        },
      },
    },
  });

  if (!lease) throw new Error("Faol ijara shartnomasi topilmadi.");

  const attendanceCount = lease.attendance?.length || 0;
  const paymentStatus = calculateLeasePaymentStatus(lease, attendanceCount);
  if (paymentStatus === "PAID")
    throw new Error("To'lov allaqachon amalga oshirilgan.");

  const expectedAmount = calculateExpectedPayment(lease, attendanceCount);
  if (Number(amount) < expectedAmount) {
    throw new Error(`To'lov summasi kam. Kerakli summa: ${expectedAmount} UZS`);
  }

  // Remove old PENDING transaction
  const existingPending = await prisma.transaction.findFirst({
    where: {
      leaseId,
      status: "PENDING",
      createdAt: { gte: new Date(currentYear, currentMonth, 1) },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingPending) {
    await prisma.transaction.delete({ where: { id: existingPending.id } });
    console.log(`Deleted old PENDING transaction ${existingPending.id}`);
  }

  const transaction = await prisma.transaction.create({
    data: {
      amount: new Prisma.Decimal(amount),
      status: "PENDING",
      leaseId,
      provider: payment_method,
    },
  });

  let storageId;
  if (lease.storeId && lease.store) storageId = lease.store.kassaID;
  else if (lease.stallId && lease.stall)
    storageId = lease.stall.stallNumber || `STALL_${lease.stallId}`;
  if (!storageId)
    throw new Error("Lease is not associated with a valid store or stall.");

  try {
    let paymentUrl;
    const payload = {
      lease_id: lease.id,
      storage_id: storageId,
      amount,
      tenant_id: process.env.TENANT_ID,
      payment_method : payment_method.toUpperCase(),
      callback_url: `https://${process.env.MY_DOMAIN}/api/payments/webhook/update-status`,
    };

    const headers = {
      "Content-Type": "application/json",
      "X-Webhook-Secret": process.env.CENTRAL_PAYMENT_SERVICE_SECRET,
    };

    if (payment_method === "PAYME") {
      const response = await axios.post(
        `${process.env.CENTRAL_PAYMENT_SERVICE_URL}/payment/transactions/create`,
        payload,
        { headers }
      );
      if (!response.data?.payme_link)
        throw new Error(`Invalid response from ${payment_method}.`);
      paymentUrl = response.data.payme_link;
    } else if (payment_method === "CLICK") {
      const response = await axios.post(
        `${process.env.CENTRAL_PAYMENT_SERVICE_URL}/click/transactions/create`,
        payload,
        { headers }
      );
      if (!response.data?.click_link)
        throw new Error("Invalid response from Click.");
      paymentUrl = response.data.click_link;
    } else {
      throw new Error("Unsupported payment provider.");
    }

    return { checkoutUrl: paymentUrl, transactionId: transaction.id };
  } catch (error) {
    console.error(
      "Payment provider call failed:",
      error.response?.data || error.message
    );
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "FAILED" },
    });
    throw new Error("To'lov xizmati vaqtincha ishlamayapti.");
  }
};

// Find leases by owner
const findLeasesByOwner = async (identifier) => {
  if (!identifier)
    throw new Error("STIR yoki telefon raqami kiritilishi shart.");
  const owner = await prisma.owner.findFirst({
    where: { OR: [{ tin: identifier }, { phoneNumber: identifier }] },
  });
  if (!owner) throw new Error("Bu ma'lumotlarga ega tadbirkor topilmadi.");
  const leases = await prisma.lease.findMany({
    where: { ownerId: owner.id, isActive: true },
    select: {
      id: true,
      shopMonthlyFee: true,
      store: { select: { storeNumber: true } },
      stall: { select: { stallNumber: true } },
    },
  });
  if (!leases.length)
    throw new Error(
      "Bu tadbirkorga tegishli faol ijara shartnomalari topilmadi."
    );
  return leases;
};

// Public lease search
const searchPublicLeases = async (searchTerm) => {
  if (!searchTerm?.trim()) return [];
  return await prisma.lease.findMany({
    where: {
      isActive: true,
      OR: [
        { owner: { fullName: { contains: searchTerm, mode: "insensitive" } } },
        { owner: { tin: { contains: searchTerm } } },
        { owner: { phoneNumber: { contains: searchTerm } } },
        {
          store: { storeNumber: { contains: searchTerm, mode: "insensitive" } },
        },
        {
          stall: { stallNumber: { contains: searchTerm, mode: "insensitive" } },
        },
      ],
    },
    select: {
      id: true,
      owner: { select: { fullName: true, tin: true } },
      store: { select: { storeNumber: true } },
      stall: { select: { stallNumber: true } },
    },
    take: 10,
  });
};

module.exports = {
  getLeaseForPayment,
  initiatePayment,
  findLeasesByOwner,
  calculateLeasePaymentStatus,
  calculateExpectedPayment,
  searchPublicLeases,
};

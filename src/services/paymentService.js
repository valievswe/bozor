const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();
const axios = require("axios");

// --- HELPER FUNCTIONS ---

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
      if (date.getDay() !== 0) workdays++;
      date.setDate(date.getDate() + 1);
    }
    const payableDays = workdays - attendanceCount;
    return totalFee * (payableDays > 0 ? payableDays : 0);
  }
  return totalFee;
};

const calculateLeasePaymentStatus = (lease, attendanceCount = 0) => {
  if (!lease || !lease.transactions || lease.transactions.length === 0) {
    return "UNPAID";
  }
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();
  const expectedAmount = calculateExpectedPayment(lease, attendanceCount);

  if (lease.paymentInterval === "MONTHLY") {
    const totalPaidThisMonth = lease.transactions
      .filter(tx => {
        const txDate = new Date(tx.createdAt);
        return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth;
      })
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    if (totalPaidThisMonth >= expectedAmount) return "PAID";
  } else if (lease.paymentInterval === "DAILY") {
    const paidToday = lease.transactions.some(tx => {
      const txDate = new Date(tx.createdAt);
      return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth && txDate.getDate() === currentDate;
    });
    if (paidToday) return "PAID";
  }
  return "UNPAID";
};

// --- MAIN SERVICE FUNCTIONS ---

const getLeaseForPayment = async (leaseId) => {
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId, isActive: true },
    include: {
      owner: { select: { fullName: true } },
      store: { select: { storeNumber: true } },
      stall: { select: { stallNumber: true } },
      transactions: { where: { status: "PAID" }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!lease) throw new Error("Faol ijara shartnomasi topilmadi.");

  const attendanceCount = await prisma.attendance.count({
    where: {
      leaseId: lease.id,
      date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    },
  });
  const totalFee = calculateExpectedPayment(lease, attendanceCount);
  const paymentStatus = calculateLeasePaymentStatus(lease, attendanceCount);

  return {
    id: lease.id,
    totalFee,
    ownerName: lease.owner.fullName,
    storeNumber: lease.store?.storeNumber,
    stallNumber: lease.stall?.stallNumber,
    paymentStatus: paymentStatus,
    paymentInterval: lease.paymentInterval,
  };
};

const initiatePayment = async (leaseId, amount, payment_method) => {
  console.log(`--- [PAYMENT INITIATION STARTED] ---`);
  console.log(`Lease ID: ${leaseId}, Amount: ${amount}, Provider: ${payment_method}`);

  if (!payment_method) throw new Error("Payment provider is required.");

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const lease = await prisma.lease.findUnique({
    where: { id: leaseId, isActive: true },
    include: {
      store: true,
      stall: true,
      transactions: { where: { status: "PAID", createdAt: { gte: new Date(currentYear, currentMonth, 1) } } },
      attendance: { where: { date: { gte: new Date(currentYear, currentMonth, 1) } } },
    },
  });
  if (!lease) throw new Error("Faol ijara shartnomasi topilmadi.");

  const attendanceCount = lease.attendance.length;
  const paymentStatus = calculateLeasePaymentStatus(lease, attendanceCount);
  if (paymentStatus === "PAID") throw new Error("Bu ijara uchun joriy davr to'lovi allaqachon to'langan.");

  const expectedAmount = calculateExpectedPayment(lease, attendanceCount);
  if (Number(amount) < expectedAmount) throw new Error(`To'lov summasi kam. Kerakli summa: ${expectedAmount} UZS`);

  await prisma.transaction.deleteMany({ where: { leaseId, status: "PENDING" } });

  const transaction = await prisma.transaction.create({
    data: {
      amount: new Prisma.Decimal(amount),
      status: "PENDING",
      leaseId,
      paymentMethod: payment_method.toUpperCase(),
    },
  });

  const storageIdSource = lease.store?.kassaID || lease.store?.id || lease.stall?.id;
  if (!storageIdSource) throw new Error("Lease is not associated with a valid store or stall.");
  
  const storageIdAsNumber = parseInt(storageIdSource, 10);
  if (isNaN(storageIdAsNumber)) throw new Error(`Invalid format for storage_id source: ${storageIdSource}`);

  // --- THIS IS THE CORRECTED TRY/CATCH BLOCK ---
  try {
    const payload = {
      lease_id: lease.id,
      storage_id: storageIdAsNumber,
      amount: Number(amount),
      tenant_id: process.env.TENANT_ID,
      payment_method: payment_method.toLowerCase(),
      callback_url: `https://${process.env.MY_DOMAIN}/api/payments/webhook/update-status`,
      return_url: `https://${process.env.MY_DOMAIN}/pay/status/${transaction.id}`,
    };

    const headers = {
      "Content-Type": "application/json",
      "X-Webhook-Secret": process.env.CENTRAL_PAYMENT_SERVICE_SECRET,
    };

    console.log("Calling central service with payload:", JSON.stringify(payload, null, 2));

    const response = await axios.post(
      `${process.env.CENTRAL_PAYMENT_SERVICE_URL}/payment/transactions/create`,
      payload,
      { headers }
    );

    console.log("Central service response:", JSON.stringify(response.data, null, 2));

    const paymentUrl = response.data?.payme_link || response.data?.click_link;
    if (!paymentUrl) throw new Error("Invalid response from payment service - no payment link found.");

    return { checkoutUrl: paymentUrl, transactionId: transaction.id };

  } catch (error) {
    console.error("Payment provider call failed:", error.response?.data || error.message);
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "FAILED" },
    });
    const specificError = error.response?.data?.error || "To'lov xizmati vaqtincha ishlamayapti.";
    throw new Error(specificError);
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

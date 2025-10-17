const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();
const axios = require("axios");

const calculateExpectedPayment = (lease, month, year) => {
  const totalFee =
    (Number(lease.shopMonthlyFee) || 0) +
    (Number(lease.stallMonthlyFee) || 0) +
    (Number(lease.guardFee) || 0);

  if (lease.paymentInterval === "DAILY") {
    let workdays = 0;
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      if (date.getDay() !== 0) workdays++;
      date.setDate(date.getDate() + 1);
    }
    const attendanceCount =
      lease.attendance?.filter((a) => {
        const d = new Date(a.date);
        return d.getFullYear() === year && d.getMonth() === month;
      }).length || 0;
    const missedDays = Math.max(workdays - attendanceCount, 0);
    const perDayRate = totalFee / workdays;
    return missedDays * perDayRate;
  }

  return totalFee;
};

const calculateLeasePaymentStatus = async (leaseId) => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const record = await prisma.leaseMonthPayment.findUnique({
    where: { leaseId_month_year: { leaseId, month, year } },
  });
  if (!record) return "UNPAID";
  if (record.paid >= record.expected) return "PAID";
  if (record.paid > 0 && record.paid < record.expected) return "PARTIALLY_PAID";
  return "UNPAID";
};

const getLeaseForPayment = async (leaseId) => {
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId, isActive: true },
    include: {
      owner: { select: { fullName: true } },
      store: { select: { storeNumber: true } },
      stall: { select: { stallNumber: true } },
      attendance: true,
    },
  });

  if (!lease) throw new Error("Faol ijara shartnomasi topilmadi.");

  const now = new Date();
  const paymentStatus = await calculateLeasePaymentStatus(leaseId);
  const expectedAmount = calculateExpectedPayment(
    lease,
    now.getMonth(),
    now.getFullYear()
  );

  return {
    id: lease.id,
    ownerName: lease.owner.fullName,
    storeNumber: lease.store?.storeNumber,
    stallNumber: lease.stall?.stallNumber,
    paymentStatus,
    expectedAmount,
  };
};

const applyPaymentToLease = async (
  leaseId,
  amount,
  paymentMethod = "CLICK"
) => {
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId, isActive: true },
    include: { attendance: true, store: true, stall: true },
  });

  if (!lease) throw new Error("Faol ijara shartnomasi topilmadi.");

  let remaining = Number(amount);

  let monthRecords = await prisma.leaseMonthPayment.findMany({
    where: { leaseId },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let currentMonthRecord = monthRecords.find(
    (r) => r.year === currentYear && r.month === currentMonth
  );

  if (!currentMonthRecord) {
    const expected = calculateExpectedPayment(lease, currentMonth, currentYear);
    currentMonthRecord = await prisma.leaseMonthPayment.create({
      data: {
        leaseId,
        month: currentMonth,
        year: currentYear,
        expected,
        paid: 0,
        debt: expected,
      },
    });
    monthRecords.push(currentMonthRecord);
  }

  for (let record of monthRecords) {
    if (remaining <= 0) break;
    const debt = record.expected - record.paid;
    if (debt <= 0) continue;
    const payAmount = Math.min(remaining, debt);
    await prisma.leaseMonthPayment.update({
      where: { id: record.id },
      data: {
        paid: record.paid + payAmount,
        debt: record.expected - (record.paid + payAmount),
      },
    });
    remaining -= payAmount;
  }

  const transaction = await prisma.transaction.create({
    data: {
      amount: new Prisma.Decimal(amount),
      status: "PENDING",
      leaseId,
      paymentMethod,
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
      payment_method: paymentMethod.toLowerCase(),
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
    const link =
      response.data?.payme_link ||
      response.data?.click_link ||
      response.data?.checkout_url;
    if (!link) throw new Error("Invalid response from payment service");
    return {
      checkoutUrl: link,
      transactionId: transaction.id,
      remainingAmount: Math.max(remaining, 0),
      paymentMethod,
    };
  } catch (error) {
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "FAILED" },
    });
    throw new Error("To‘lov xizmati vaqtincha ishlamayapti.");
  }
};

const initiatePayment = async (leaseId, amount, paymentMethod = "CLICK") =>
  await applyPaymentToLease(leaseId, amount, paymentMethod);

const getCurrentMonthDebt = async (leaseId) => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const record = await prisma.leaseMonthPayment.findUnique({
    where: { leaseId_month_year: { leaseId, month, year } },
  });
  if (!record) return { expected: 0, paid: 0, debt: 0, status: "UNPAID" };
  const status =
    record.paid >= record.expected
      ? "PAID"
      : record.paid > 0
      ? "PARTIALLY_PAID"
      : "UNPAID";
  return {
    expected: Number(record.expected),
    paid: Number(record.paid),
    debt: Number(record.debt),
    status,
  };
};

const getLeasePaymentSummary = async (leaseId) => {
  const records = await prisma.leaseMonthPayment.findMany({
    where: { leaseId },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });
  const summary = records.map((r) => ({
    month: `${r.year}-${String(r.month + 1).padStart(2, "0")}`,
    expected: Number(r.expected),
    paid: Number(r.paid),
    debt: Number(r.debt),
  }));
  const totalPaid = summary.reduce((sum, m) => sum + m.paid, 0);
  const totalDebt = summary.reduce((sum, m) => sum + m.debt, 0);
  return { summary, totalPaid, totalDebt };
};

const findLeasesByOwner = async (identifier) => {
  const owner = await prisma.owner.findFirst({
    where: {
      OR: [{ stir: identifier }, { phone: { contains: identifier } }],
    },
    include: {
      leases: {
        where: { isActive: true },
        include: {
          store: { select: { storeNumber: true } },
          stall: { select: { stallNumber: true } },
        },
      },
    },
  });
  if (!owner || owner.leases.length === 0)
    throw new Error("Faol shartnomalar topilmadi.");
  return owner.leases.map((lease) => ({
    leaseId: lease.id,
    certificateNumber: lease.certificateNumber,
    storeNumber: lease.store?.storeNumber,
    stallNumber: lease.stall?.stallNumber,
    expiryDate: lease.expiryDate,
    isActive: lease.isActive,
  }));
};

const searchPublicLeases = async (term) => {
  const leases = await prisma.lease.findMany({
    where: {
      isActive: true,
      OR: [
        { certificateNumber: { contains: term, mode: "insensitive" } },
        { owner: { fullName: { contains: term, mode: "insensitive" } } },
        { store: { storeNumber: { contains: term, mode: "insensitive" } } },
        { stall: { stallNumber: { contains: term, mode: "insensitive" } } },
      ],
    },
    include: {
      owner: { select: { fullName: true } },
      store: { select: { storeNumber: true } },
      stall: { select: { stallNumber: true } },
    },
    take: 20,
  });
  return leases.map((l) => ({
    id: l.id,
    certificateNumber: l.certificateNumber,
    ownerName: l.owner.fullName,
    storeNumber: l.store?.storeNumber,
    stallNumber: l.stall?.stallNumber,
    expiryDate: l.expiryDate,
  }));
};

module.exports = {
  getLeaseForPayment,
  initiatePayment,
  calculateLeasePaymentStatus,
  calculateExpectedPayment,
  getLeasePaymentSummary,
  getCurrentMonthDebt,
  findLeasesByOwner,
  searchPublicLeases,
  applyPaymentToLease,
};

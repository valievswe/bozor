const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();
const axios = require("axios");

const CENTRAL_PAYMENT_SERVICE_URL = process.env.CENTRAL_PAYMENT_SERVICE_URL;

// Helper function to calculate expected payment amount for a lease
const calculateExpectedPayment = (lease, attendanceCount = 0) => {
  const totalFee =
    (Number(lease.shopMonthlyFee) || 0) +
    (Number(lease.stallMonthlyFee) || 0) +
    (Number(lease.guardFee) || 0);

  if (lease.paymentInterval === "DAILY") {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // Calculate workdays in current month (Mon-Sat)
    let workdays = 0;
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0) workdays++; // Not Sunday
      date.setDate(date.getDate() + 1);
    }

    const payableDays = workdays - attendanceCount;
    return totalFee * payableDays;
  }

  return totalFee; // MONTHLY
};

const calculateLeasePaymentStatus = (lease, attendanceCount = 0) => {
  if (!lease || !lease.transactions) return "UNPAID";

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();

  // Calculate expected amount
  const expectedAmount = calculateExpectedPayment(lease, attendanceCount);

  if (lease.paymentInterval === "MONTHLY") {
    // Sum all PAID transactions for current month
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
    // Check if payment made today
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

  const paymentStatus = calculateLeasePaymentStatus(lease);

  const responseData = {
    ...lease,
    totalFee,
    ownerName: lease.owner.fullName,
    storeNumber: lease.store?.storeNumber,
    stallNumber: lease.stall?.stallNumber,
    paymentStatus: paymentStatus,
  };
  return responseData;
};

const initiatePayment = async (leaseId, amount) => {
  console.log(`--- [PAYMENT INITIATION STARTED] ---`);
  console.log(
    `Step 1: Received request for Lease ID: ${leaseId}, Amount: ${amount}`
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

  if (!lease) {
    throw new Error("Faol ijara shartnomasi topilmadi.");
  }

  // Step 2: Check if already paid this period
  const attendanceCount = lease.attendance?.length || 0;
  const paymentStatus = calculateLeasePaymentStatus(lease, attendanceCount);
  if (paymentStatus === "PAID") {
    console.warn(
      `Step 2: FAILED. Lease ${leaseId} is already PAID for this period.`
    );
    throw new Error(
      "Bu ijara shartnomasi uchun joriy davr to'lovi allaqachon to'langan."
    );
  }
  console.log(`Step 2: Payment status is ${paymentStatus}. Proceeding.`);

  // Step 3: Validate payment amount
  const expectedAmount = calculateExpectedPayment(lease, attendanceCount);
  if (Number(amount) < expectedAmount) {
    console.warn(
      `Step 3: FAILED. Amount ${amount} is less than expected ${expectedAmount}`
    );
    throw new Error(
      `To'lov summasi kutilganidan kam. Kerakli summa: ${expectedAmount} UZS`
    );
  }
  console.log(
    `Step 3: Amount validated. Expected: ${expectedAmount}, Received: ${amount}`
  );

  // Step 4: Check for existing PENDING transaction
  const existingPending = await prisma.transaction.findFirst({
    where: {
      leaseId: leaseId,
      status: "PENDING",
      createdAt: {
        gte: new Date(currentYear, currentMonth, 1),
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingPending) {
    console.log(
      `Step 4: Found existing PENDING transaction ${existingPending.id}. Deleting it to create a fresh one.`
    );
    // Delete the old pending transaction so we can create a new one with a fresh PayMe link
    await prisma.transaction.delete({
      where: { id: existingPending.id },
    });
    console.log(`Step 4.5: Deleted old PENDING transaction ${existingPending.id}.`);
  } else {
    console.log(`Step 4: No existing PENDING transaction found.`);
  }

  const transaction = await prisma.transaction.create({
    data: {
      amount: new Prisma.Decimal(amount),
      status: "PENDING",
      leaseId,
    },
  });
  console.log(
    `Step 5: Created PENDING Transaction ID: ${transaction.id} in our database.`
  );

  // Determine storage_id based on whether it's a store or stall
  let storageId;
  if (lease.storeId && lease.store) {
    storageId = lease.store.kassaID; // Use kassaID for stores
  } else if (lease.stallId && lease.stall) {
    // For stalls, use stallNumber or stall ID - adjust based on central service expectations
    storageId = lease.stall.stallNumber || `STALL_${lease.stallId}`;
  }

  if (!storageId) {
    console.error(
      `Step 6: FAILED. Lease ${leaseId} has no valid store or stall with kassaID/stallNumber.`
    );
    throw new Error("Lease is not associated with a valid store or stall.");
  }

  const payload = {
    lease_id: lease.id,
    storage_id: storageId,
    amount: amount,
    tenant_id: process.env.TENANT_ID,
    callback_url: `https://${process.env.MY_DOMAIN}/api/payments/webhook/update-status`,
  };
  console.log(`Step 6: Built payload for central service.`);

  try {
    const endpoint = `${process.env.CENTRAL_PAYMENT_SERVICE_URL}/payment/transactions/create`;
    const requestHeaders = {
      "Content-Type": "application/json",
      "X-Webhook-Secret": process.env.CENTRAL_PAYMENT_SERVICE_SECRET,
    };

    console.log(`Step 7: Sending POST request to: ${endpoint}`);
    console.log(`  -> HEADERS: ${JSON.stringify(requestHeaders)}`);
    console.log(`  -> PAYLOAD: ${JSON.stringify(payload)}`);

    const response = await axios.post(endpoint, payload, {
      headers: requestHeaders,
    });

    console.log(`Step 8: SUCCESS. Received response from central service.`);
    console.log(`  -> STATUS: ${response.status}`);
    console.log(`  -> DATA: ${JSON.stringify(response.data)}`);

    if (!response.data || !response.data.payme_link) {
      throw new Error(
        "Central payment service did not return a valid payme_link."
      );
    }

    console.log(`--- [PAYMENT INITIATION FINISHED] ---`);
    return {
      checkoutUrl: response.data.payme_link,
      transactionId: transaction.id,
    };
  } catch (error) {
    console.error(`Step 9: FAILED. Call to central service failed.`);
    // Log the detailed error from Axios
    if (error.response) {
      console.error(`  -> ERROR STATUS: ${error.response.status}`);
      console.error(`  -> ERROR DATA: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`  -> ERROR MESSAGE: ${error.message}`);
    }

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "FAILED" },
    });
    console.error(
      `Step 10: Marked Transaction ID: ${transaction.id} as FAILED.`
    );
    console.log(`--- [PAYMENT INITIATION FINISHED WITH ERROR] ---`);
    throw new Error("To'lov xizmati vaqtincha ishlamayapti.");
  }
};

const findLeasesByOwner = async (identifier) => {
  if (!identifier)
    throw new Error("STIR (INN) yoki telefon raqami kiritilishi shart.");
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
  if (leases.length === 0)
    throw new Error(
      "Bu tadbirkorga tegishli faol ijara shartnomalari topilmadi."
    );
  return leases;
};

const searchPublicLeases = async (searchTerm) => {
  console.log(`--- [BACKEND SEARCH] Received search term: "${searchTerm}" ---`);

  if (!searchTerm || !searchTerm.trim()) {
    return [];
  }

  const leases = await prisma.lease.findMany({
    where: {
      isActive: true,
      OR: [
        {
          owner: {
            fullName: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        },
        {
          owner: {
            tin: {
              contains: searchTerm,
            },
          },
        },
        {
          owner: {
            phoneNumber: {
              contains: searchTerm,
            },
          },
        },
        {
          store: {
            storeNumber: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        },
        {
          stall: {
            stallNumber: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        },
      ],
    },
    select: {
      id: true,
      owner: {
        select: {
          fullName: true,
          tin: true,
        },
      },
      store: {
        select: {
          storeNumber: true,
        },
      },
      stall: {
        select: {
          stallNumber: true,
        },
      },
    },
    take: 10,
  });

  return leases;
};

module.exports = {
  getLeaseForPayment,
  initiatePayment,
  findLeasesByOwner,
  calculateLeasePaymentStatus,
  calculateExpectedPayment,
  searchPublicLeases,
};

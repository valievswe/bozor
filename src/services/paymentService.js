const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();
const axios = require("axios");

const CENTRAL_PAYMENT_SERVICE_URL = process.env.CENTRAL_PAYMENT_SERVICE_URL;

const calculateLeasePaymentStatus = (lease) => {
  if (!lease || !lease.transactions) return "UNPAID";
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();
  if (lease.transactions.length > 0) {
    const lastPaymentDate = new Date(lease.transactions[0].createdAt);
    if (lease.paymentInterval === "MONTHLY") {
      if (
        lastPaymentDate.getFullYear() === currentYear &&
        lastPaymentDate.getMonth() === currentMonth
      )
        return "PAID";
    } else if (lease.paymentInterval === "DAILY") {
      if (
        lastPaymentDate.getFullYear() === currentYear &&
        lastPaymentDate.getMonth() === currentMonth &&
        lastPaymentDate.getDate() === currentDate
      )
        return "PAID";
    }
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

  const lease = await prisma.lease.findUnique({
    where: { id: leaseId, isActive: true },
    include: {
      transactions: {
        where: { status: "PAID" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const paymentStatus = calculateLeasePaymentStatus(lease);
  if (paymentStatus === "PAID") {
    console.warn(
      `Step 2.5: FAILED. Lease ${leaseId} is already PAID for this period.`
    );
    throw new Error(
      "Bu ijara shartnomasi uchun joriy davr to'lovi allaqachon to'langan."
    );
  }
  console.log(`Step 2.5: Payment status is ${paymentStatus}. Proceeding.`);

  const transaction = await prisma.transaction.create({
    data: {
      amount: new Prisma.Decimal(amount),
      status: "PENDING",
      leaseId,
    },
  });
  console.log(
    `Step 3: Created PENDING Transaction ID: ${transaction.id} in our database.`
  );

  const payload = {
    lease_id: lease.id,
    storage_id: lease.storeId || lease.stallId,
    amount: amount,
    tenant_id: process.env.TENANT_ID,
    callback_url: `https://${process.env.MY_DOMAIN}/api/payments/webhook/update-status`,
  };

  if (!payload.storage_id) {
    console.error(
      `Step 4: FAILED. Lease ${leaseId} has no storeId or stallId.`
    );
    throw new Error("Lease is not associated with a valid store or stall.");
  }
  console.log(`Step 4: Built payload for central service.`);

  try {
    const endpoint = `${process.env.CENTRAL_PAYMENT_SERVICE_URL}/payment/transactions/create`;
    const requestHeaders = {
      "Content-Type": "application/json",
      "X-Webhook-Secret": process.env.CENTRAL_PAYMENT_SERVICE_SECRET,
    };

    console.log(`Step 5: Sending POST request to: ${endpoint}`);
    console.log(`  -> HEADERS: ${JSON.stringify(requestHeaders)}`);
    console.log(`  -> PAYLOAD: ${JSON.stringify(payload)}`);

    const response = await axios.post(endpoint, payload, {
      headers: requestHeaders,
    });

    console.log(`Step 6: SUCCESS. Received response from central service.`);
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
    console.error(`Step 6: FAILED. Call to central service failed.`);
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
      `Step 7: Marked Transaction ID: ${transaction.id} as FAILED.`
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
  searchPublicLeases,
};

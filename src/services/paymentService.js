// src/services/paymentService.js
const { PrismaClient } = require("@prisma/client");
const axios = require("axios");
const crypto = require("crypto");

const prisma = new PrismaClient();

// Payme API configuration
const PAYME_CONFIG = {
  merchantId: process.env.PAYME_MERCHANT_ID,
  secretKey: process.env.PAYME_SECRET_KEY,
  baseUrl: process.env.PAYME_BASE_URL || "https://checkout.paycom.uz",
};

/**
 * Generate signature for Payme API requests
 */
const generateSignature = (params, method) => {
  const data = `${method}.${JSON.stringify(params)}`;
  return crypto
    .createHmac("sha256", PAYME_CONFIG.secretKey)
    .update(data)
    .digest("hex");
};

/**
 * Get lease information for payment page
 */
const getLeaseForPayment = async (leaseId) => {
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId },
    include: {
      owner: {
        select: {
          fullName: true,
        },
      },
      store: {
        select: {
          storeNumber: true,
          area: true,
        },
      },
      stall: {
        select: {
          stallNumber: true,
          area: true,
        },
      },
    },
  });

  if (!lease) {
    throw new Error("Lease not found");
  }

  if (!lease.isActive) {
    throw new Error("Lease is not active");
  }

  // Calculate total fee
  let totalFee = 0;
  if (lease.shopMonthlyFee) totalFee += Number(lease.shopMonthlyFee);
  if (lease.stallMonthlyFee) totalFee += Number(lease.stallMonthlyFee);
  if (lease.guardFee) totalFee += Number(lease.guardFee);

  return {
    id: lease.id,
    certificateNumber: lease.certificateNumber,
    ownerName: lease.owner.fullName,
    storeNumber: lease.store?.storeNumber,
    stallNumber: lease.stall?.stallNumber,
    area: lease.store?.area || lease.stall?.area,
    totalFee,
    paymeKassaId: lease.paymeKassaId,
  };
};

/**
 * Initiate payment with Payme
 */
const initiatePayment = async (leaseId, amount) => {
  // Get lease information
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId },
  });

  if (!lease) {
    throw new Error("Lease not found");
  }

  if (!lease.isActive) {
    throw new Error("Lease is not active");
  }

  // Create transaction record
  const transaction = await prisma.transaction.create({
    data: {
      amount,
      status: "PENDING",
      leaseId,
    },
  });

  // Prepare Payme API request
  const params = {
    amount: Math.round(amount * 100), // Payme expects amount in tiyin (1 UZS = 100 tiyin)
    account: {
      lease_id: leaseId.toString(),
    },
    merchant: PAYME_CONFIG.merchantId,
  };

  const method = "merchants.create";
  const signature = generateSignature(params, method);

  try {
    // Call Payme API
    const response = await axios.post(
      `${PAYME_CONFIG.baseUrl}/api`,
      {
        method,
        params,
        id: transaction.id,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth": signature,
        },
      }
    );

    if (response.data.result) {
      // Update transaction with Payme transaction ID
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          paymeTransactionId: response.data.result.checkout_url
            .split("/")
            .pop(),
        },
      });

      return {
        checkout_url: response.data.result.checkout_url,
        transaction_id: transaction.id,
      };
    } else {
      throw new Error("Failed to create Payme transaction");
    }
  } catch (error) {
    // Update transaction status to failed
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "FAILED" },
    });

    throw new Error(`Payme API error: ${error.message}`);
  }
};

/**
 * Handle Payme callback/webhook
 */
const handlePaymeCallback = async (payload) => {
  const { method, params, id } = payload;

  switch (method) {
    case "CheckPerformTransaction":
      return await checkPerformTransaction(params, id);
    case "PerformTransaction":
      return await performTransaction(params, id);
    case "CancelTransaction":
      return await cancelTransaction(params, id);
    default:
      throw new Error(`Unknown method: ${method}`);
  }
};

/**
 * Check if transaction can be performed
 */
const checkPerformTransaction = async (params, id) => {
  const { account } = params;
  const leaseId = parseInt(account.lease_id);

  // Find transaction
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: parseInt(id),
      leaseId,
      status: "PENDING",
    },
    include: {
      lease: true,
    },
  });

  if (!transaction) {
    return {
      error: {
        code: -31008,
        message: "Transaction not found or already processed",
      },
    };
  }

  // Verify amount
  if (transaction.amount !== params.amount / 100) {
    return {
      error: {
        code: -31001,
        message: "Invalid amount",
      },
    };
  }

  return {
    result: {
      allow: true,
    },
  };
};

/**
 * Perform the transaction
 */
const performTransaction = async (params, id) => {
  const { account } = params;
  const leaseId = parseInt(account.lease_id);

  // Find transaction
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: parseInt(id),
      leaseId,
      status: "PENDING",
    },
  });

  if (!transaction) {
    return {
      error: {
        code: -31008,
        message: "Transaction not found or already processed",
      },
    };
  }

  // Update transaction status
  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      status: "PAID",
      paymeTransactionId: params.transact,
    },
  });

  return {
    result: {
      transaction: params.transact,
      perform_time: Date.now(),
    },
  };
};

/**
 * Cancel transaction
 */
const cancelTransaction = async (params, id) => {
  const { account } = params;
  const leaseId = parseInt(account.lease_id);

  // Find transaction
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: parseInt(id),
      leaseId,
      status: "PENDING",
    },
  });

  if (!transaction) {
    return {
      error: {
        code: -31008,
        message: "Transaction not found or already processed",
      },
    };
  }

  // Update transaction status
  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      status: "CANCELLED",
    },
  });

  return {
    result: {
      transaction: params.transact,
      cancel_time: Date.now(),
    },
  };
};

const getAllTransactions = async () => {
  return prisma.transaction.findMany({
    orderBy: {
      createdAt: "desc", // Show the newest transactions first
    },
    include: {
      lease: {
        include: {
          owner: {
            select: {
              fullName: true,
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
      },
    },
  });
};

module.exports = {
  getLeaseForPayment,
  initiatePayment,
  handlePaymeCallback,
  getAllTransactions,
};

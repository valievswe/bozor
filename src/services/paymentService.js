// src/services/paymentService.js
const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();
const axios = require("axios");

//payment service
const CENTRAL_PAYMENT_SERVICE_URL = process.env.CENTRAL_PAYMENT_SERVICE_URL;

/**
 * Fetches public, non-sensitive lease info for payment confirmation page.
 */
const getLeaseForPayment = async (leaseId) => {
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId, isActive: true },
    select: {
      id: true,
      shopMonthlyFee: true,
      stallMonthlyFee: true,
      guardFee: true,
      owner: { select: { fullName: true } },
      store: { select: { storeNumber: true } },
      stall: { select: { stallNumber: true } },
    },
  });
  if (!lease) throw new Error("Faol ijara shartnomasi topilmadi.");
  const totalFee =
    (Number(lease.shopMonthlyFee) || 0) +
    (Number(lease.stallMonthlyFee) || 0) +
    (Number(lease.guardFee) || 0);
  return { ...lease, totalFee };
};

/**
 * Initiates a payment by creating a local PENDING transaction
 * and then delegating the actual payment processing to the central service.
 */
const initiatePayment = async (leaseId, amount) => {
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId, isActive: true },
  });
  if (!lease) throw new Error("Faol ijara shartnomasi topilmadi.");

  // 1. Create a PENDING transaction in YOUR database.
  const transaction = await prisma.transaction.create({
    data: {
      amount: new Prisma.Decimal(amount),
      status: "PENDING",
      leaseId,
    },
  });

  // 2. Prepare the data payload to send to payment service.
  const payload = {
    contract_id: lease.id,
    amount: amount,

    tenant_id: process.env.TENANT_ID, // e.g., 'myrent', 'rizq-baraka'
    callback_url: `https://${process.env.MY_DOMAIN}/api/payments/webhook/update-status`,
  };

  try {
    // 3. Call payment service.
    console.log(
      `Calling central payment service for Lease ID ${lease.id} with payload:`,
      payload
    );
    const response = await axios.post(CENTRAL_PAYMENT_SERVICE_URL, payload);

    if (!response.data || !response.data.checkout_url) {
      throw new Error(
        "Central payment service did not return a valid checkout URL."
      );
    }

    // 4. Return the checkout URL that payment service provides.
    return {
      checkoutUrl: response.data.checkout_url,
      transactionId: transaction.id, // internal transaction ID
    };
  } catch (error) {
    // If the call to payment service fails, update transaction status as FAILED.
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "FAILED" },
    });
    console.error(
      "Failed to initiate payment via central service:",
      error.response?.data || error.message
    );
    throw new Error("To'lov xizmati vaqtincha ishlamayapti.");
  }
};

module.exports = {
  getLeaseForPayment,
  initiatePayment,
};

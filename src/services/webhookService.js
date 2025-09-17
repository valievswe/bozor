// src/services/webhookService.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * @description Updates the status of a transaction based on a webhook call from the central payment service.
 * @param {object} updateData - The data sent from Muhammadali's service.
 *                              Example: { contract_id: 12, status: 'PAID', payme_transaction_id: '...' }
 * @returns {Promise<object>} A success or status message.
 */
const updatePaymentStatus = async (updateData) => {
  const { contract_id, status, payme_transaction_id } = updateData;

  // Basic validation of the incoming data
  if (!contract_id || !status) {
    throw new Error("Webhook data is missing 'contract_id' or 'status'.");
  }

  const leaseId = parseInt(contract_id, 10);

  // Find the most recent PENDING transaction for this specific lease.
  const transaction = await prisma.transaction.findFirst({
    where: {
      leaseId: leaseId,
      status: "PENDING",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // If no pending transaction is found, it might have already been processed or never existed.
  if (!transaction) {
    console.warn(
      `Webhook received for a non-pending or non-existent transaction for Lease ID: ${leaseId}. Ignoring.`
    );
    return {
      status: "ok",
      message: "Transaction not found or already processed. No action taken.",
    };
  }

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      status: status.toUpperCase(), // e.g., 'PAID', 'CANCELLED', 'FAILED'
      paymeTransactionId: payme_transaction_id,
    },
  });

  console.log(
    `Webhook successfully updated transaction ${transaction.id} for Lease ${leaseId} to status: ${status}`
  );
  return { status: "ok", message: "Status updated successfully." };
};

module.exports = {
  updatePaymentStatus,
};

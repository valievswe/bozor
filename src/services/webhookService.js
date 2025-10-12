// src/services/webhookService.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const updatePaymentStatus = async (updateData) => {
  // Use a fallback mechanism to handle different possible field names from the webhook
  const contract_id = updateData.contract_id || updateData.lease_id;
  const status = updateData.status || updateData.payment_status;
  const payme_transaction_id =
    updateData.payme_transaction_id ||
    updateData.transaction_id ||
    updateData.payme_id;
  const method = updateData.method || updateData.payment_method;

  console.log(
    `[Webhook Service] Received data:`,
    JSON.stringify(updateData, null, 2)
  );

  if (!contract_id || !status) {
    throw new Error(
      `Webhook data is missing 'contract_id'/'lease_id' or 'status'. Received: ${JSON.stringify(
        updateData
      )}`
    );
  }

  const leaseId = parseInt(contract_id, 10);

  // Find the latest PENDING transaction for this lease
  const transaction = await prisma.transaction.findFirst({
    where: { leaseId: leaseId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  if (!transaction) {
    console.warn(
      `Webhook received for non-pending transaction for Lease ID: ${leaseId}. Ignoring.`
    );
    return {
      status: "ok",
      message: "Transaction not found or already processed.",
    };
  }

  // --- START OF THE FIX ---
  // Create a new object with a different name to hold the data for the update.
  const dataToUpdate = {
    status: status.toUpperCase(),
  };
  // --- END OF THE FIX ---

  // Conditionally add optional fields to the new object
  if (payme_transaction_id) {
    dataToUpdate.paymeTransactionId = payme_transaction_id;
  }

  if (method) {
    // Make sure the method is a valid enum value, otherwise Prisma will throw an error
    const validMethod = method.toUpperCase();
    if (["PAYME", "BANK_TRANSFER", "CASH", "OTHER"].includes(validMethod)) {
      dataToUpdate.paymentMethod = validMethod;
    }
  }

  // Use the new object in the update call
  await prisma.transaction.update({
    where: { id: transaction.id },
    data: dataToUpdate,
  });

  console.log(
    `Webhook updated transaction ${
      transaction.id
    } for Lease ${leaseId} to status: ${status.toUpperCase()}`
  );

  return { status: "ok", message: "Status updated successfully." };
};

module.exports = {
  updatePaymentStatus,
};

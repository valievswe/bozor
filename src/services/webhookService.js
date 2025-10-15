const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const updatePaymentStatus = async (updateData) => {
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

  // Build update data conditionally
  const transactionUpdate = {
    status: status.toUpperCase(),
  };

  // Only add optional fields if they exist
  if (payme_transaction_id) {
    transactionUpdate.paymeTransactionId = payme_transaction_id;
  }

  if (method) {
    transactionUpdate.paymentMethod = method.toUpperCase();
  }

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: transactionUpdate,
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

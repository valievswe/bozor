const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const updatePaymentStatus = async (updateData) => {
  // Support multiple field name variations from central service
  const contract_id = updateData.contract_id || updateData.lease_id;
  const status = updateData.status || updateData.payment_status;
  const payme_transaction_id = updateData.payme_transaction_id || updateData.transaction_id || updateData.payme_id;

  console.log(`[Webhook Service] Received data:`, JSON.stringify(updateData, null, 2));

  if (!contract_id || !status) {
    throw new Error(`Webhook data is missing 'contract_id'/'lease_id' or 'status'. Received: ${JSON.stringify(updateData)}`);
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

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      status: status.toUpperCase(),
      paymeTransactionId: payme_transaction_id,
      paymentMethod: "PAYME",
    },
  });

  console.log(
    `Webhook updated transaction ${transaction.id} for Lease ${leaseId} to status: ${status}`
  );
  return { status: "ok", message: "Status updated successfully." };
};

module.exports = {
  updatePaymentStatus,
};

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const VALID_METHODS = ["PAYME", "BANK_TRANSFER", "CASH", "OTHER", "CLICK"];

const updatePaymentStatus = async (updateData) => {
  try {
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
      console.warn(
        `Webhook missing required fields: ${JSON.stringify(updateData)}`
      );
      return {
        status: "error",
        message: "Missing contract_id/lease_id or status",
      };
    }

    const leaseId = parseInt(contract_id, 10);

    const transaction = await prisma.transaction.findFirst({
      where: { leaseId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    if (!transaction) {
      console.warn(`No pending transaction for Lease ID: ${leaseId}. Ignored.`);
      return {
        status: "ok",
        message: "Transaction not found or already processed.",
      };
    }

    const dataToUpdate = {
      status: status.toUpperCase(),
    };

    if (payme_transaction_id)
      dataToUpdate.paymeTransactionId = payme_transaction_id;

    if (method) {
      const upperMethod = method.toUpperCase();
      if (VALID_METHODS.includes(upperMethod))
        dataToUpdate.paymentMethod = upperMethod;
    }

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
  } catch (err) {
    console.error("Webhook processing failed:", err);
    return { status: "error", message: "Webhook processing failed." };
  }
};

module.exports = {
  updatePaymentStatus,
};

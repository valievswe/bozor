// src/controllers/paymentController.js
const paymentService = require("../services/paymentService");

/**
 * Get lease information for payment page (public endpoint)
 */
const getLeaseForPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const leaseInfo = await paymentService.getLeaseForPayment(parseInt(id));
    res.status(200).json(leaseInfo);
  } catch (error) {
    res.status(404).json({
      message: "Lease not found or not available for payment",
      error: error.message,
    });
  }
};

/**
 * Initiate payment (public endpoint for customer payment page)
 */
const initiatePayment = async (req, res) => {
  try {
    const { leaseId, amount } = req.body;

    if (!leaseId || !amount) {
      return res.status(400).json({
        message: "Lease ID and amount are required",
      });
    }

    const result = await paymentService.initiatePayment(leaseId, amount);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      message: "Payment initiation failed",
      error: error.message,
    });
  }
};

/**
 * Handle Payme webhook/callback (public endpoint, no authentication)
 */
const handlePaymeCallback = async (req, res) => {
  try {
    const payload = req.body;
    const result = await paymentService.handlePaymeCallback(payload);
    res.status(200).json(result);
  } catch (error) {
    console.error("Payme callback error:", error);
    res.status(400).json({
      error: {
        code: -31008,
        message: "Internal server error",
      },
    });
  }
};

/**
 * Get transaction history (protected endpoint for admin)
 */
const getTransactionHistory = async (req, res) => {
  try {
    const { leaseId } = req.params;

    // This would need to be implemented in the service
    // For now, return a placeholder
    res.status(200).json({
      message: "Transaction history endpoint - to be implemented",
      leaseId,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get transaction history",
      error: error.message,
    });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const transactions = await paymentService.getAllTransactions();
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get transaction history",
      error: error.message,
    });
  }
};

module.exports = {
  getLeaseForPayment,
  initiatePayment,
  handlePaymeCallback,
  getTransactionHistory,
  getAllTransactions,
};

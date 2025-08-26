// src/routes/paymentRoutes.js
const express = require("express");
const router = express.Router();

const {
  isAuthenticated,
  hasPermission,
} = require("../middlewares/authMiddleware");
const paymentController = require("../controllers/paymentController");

// Public endpoints (no authentication required)
// These are used by the customer payment page

// Get lease information for payment page
router.get("/public/leases/:id", paymentController.getLeaseForPayment);

// Initiate payment (called from customer payment page)
router.post("/public/payments/initiate", paymentController.initiatePayment);

// Payme webhook/callback (called by Payme servers)
router.post("/payments/callback", paymentController.handlePaymeCallback);

// Protected endpoints (require authentication)
// These are for admin panel functionality

// Initiate payment from admin panel (future feature)
router.post(
  "/payments/initiate",
  [isAuthenticated, hasPermission("CREATE_TRANSACTION")],
  paymentController.initiatePayment
);

// Get transaction history for a lease
router.get(
  "/payments/transactions/:leaseId",
  [isAuthenticated, hasPermission("VIEW_TRANSACTIONS")],
  paymentController.getTransactionHistory
);

module.exports = router;

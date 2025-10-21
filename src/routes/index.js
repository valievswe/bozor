// src/routes/index.js

const express = require("express");
const authRoutes = require("./authRoutes.js");
const ownerRoutes = require("./ownerRoutes.js");
const leaseRoutes = require("./leaseRoutes.js");
const storeRoutes = require("./storeRoutes.js");
const stallRoutes = require("./stallRoutes.js");
const paymentRoutes = require("./paymentRoutes.js");
const userRoutes = require("./userRoutes.js");
const reportRoutes = require("./reportRoutes.js");
const exportRoutes = require("./exportRoutes.js");
const webhookRoutes = require("./webhookRoutes");
const attendanceRoutes = require("./attendanceRoutes");
const transactionRoutes = require("./transactionRoutes");
const sectionRoutes = require("./sectionRoutes");
const saleTypeRoutes = require("./saleTypeRoutes.js");

const router = express.Router();

// http://api/sale-types/
router.use("/sale-types", saleTypeRoutes);

// http://api/auth/
router.use("/auth", authRoutes);

// http://api/owners/
router.use("/owners", ownerRoutes);

// http://api/stores/
router.use("/stores", storeRoutes);

// http://api/leases/
router.use("/leases", leaseRoutes);

// http://api/stalls/
router.use("/stalls", stallRoutes);

// http://api/payments/
router.use("/payments", paymentRoutes);

// http://api/users/
router.use("/users", userRoutes);

// http://api/reports/
router.use("/reports", reportRoutes);

// http://api/export/
router.use("/export", exportRoutes);

// http://api/payments/webhook/
router.use("/payments/webhook", webhookRoutes);

// http://api/attendance/
router.use("/attendance", attendanceRoutes);

// http://api/transactions/
router.use("/transactions", transactionRoutes);

// http://api/sections/
router.use("/sections", sectionRoutes);

module.exports = router;

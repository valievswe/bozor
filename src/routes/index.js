// src/routes/index.js

const express = require("express");
const authRoutes = require("./authRoutes.js");
const ownerRoutes = require("./ownerRoutes.js");
const leaseRoutes = require("./leaseRoutes.js");
const storeRoutes = require("./storeRoutes.js");
const stallRoutes = require("./stallRoutes.js");
const paymentRoutes = require("./paymentRoutes.js");
const userRoutes = require("./userRoutes.js");

const router = express.Router();

// http://localhost:3000/api/auth/
router.use("/auth", authRoutes);

// http://localhost:3000/api/owners/
router.use("/owners", ownerRoutes);

// http://localhost:3000/api/stores/
router.use("/stores", storeRoutes);

// http://localhost:3000/api/leases/
router.use("/leases", leaseRoutes);

// http://localhost:3000/api/stalls/
router.use("/stalls", stallRoutes);

// http://localhost:3000/api/payments/
router.use("/payments", paymentRoutes);

// http://localhost:3000/api/users/
router.use("/users", userRoutes);

module.exports = router;

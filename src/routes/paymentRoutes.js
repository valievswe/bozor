const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// This file now ONLY handles the public-facing part of the payment initiation flow.
// All routes here are PUBLIC and do not require login.

// Endpoint for the tenant to find their leases by TIN/phone
router.post("/public/find-leases", paymentController.findLeasesByOwner);

// Endpoint for public search
router.get("/public/search", paymentController.searchPublic);

// Endpoint to get details for the confirmation page
router.get("/public/leases/:id", paymentController.getLeaseForPayment);

// Endpoint to initiate the payment and get the checkout URL from the central service
router.post("/public/initiate", paymentController.initiatePayment);

module.exports = router;

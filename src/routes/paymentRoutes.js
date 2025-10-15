const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// ==================== PUBLIC ENDPOINTS ==================== //

// 1️⃣ Tadbirkor o'z lease’larini STIR/telefon raqam orqali topish
router.post("/public/find-leases", paymentController.findLeasesByOwner);

// 2️⃣ Public search
router.get("/public/search", paymentController.searchPublic);

// 3️⃣ Lease ma’lumotini olish (confirmation page)
router.get("/public/leases/:id", paymentController.getLeaseForPayment);

// 4️⃣ To‘lovni boshlash va checkout URL olish
router.post("/public/initiate", paymentController.initiatePayment);

// 5️⃣ Oyma-oy to‘lov va qarz summary
router.get(
  "/public/leases/:id/summary",
  paymentController.getLeasePaymentSummary
);

// 6️⃣ Faqat joriy oy uchun qarzdorlikni olish
router.get(
  "/public/leases/:id/current-debt",
  paymentController.getCurrentMonthDebt
);

module.exports = router;

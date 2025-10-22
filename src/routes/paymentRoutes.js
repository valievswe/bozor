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

// ==================== STALL ATTENDANCE PAYMENT ==================== //

// 7️⃣ Get stall information for attendance payment
router.get("/public/stalls/:id", paymentController.getStallForPayment);

/**
 * @swagger
 * /public/stalls/{id}/pay:
 *   post:
 *     summary: Initiate stall payment
 *     description: |
 *       Starts a payment process for a specific stall by its ID.
 *       The system generates a payment URL and returns it in the response.
 *     tags:
 *       - Payments
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Stall ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payment_method:
 *                 type : string
 *     responses:
 *       200:
 *         description: Payment initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Payment initiated successfully
 *                 paymentUrl:
 *                   type: string
 *                   example: https://pay.click.uz/some/unique/url
 *       400:
 *         description: Invalid stall ID or request body
 *       404:
 *         description: Stall not found
 *       500:
 *         description: Server error during payment initiation
 */
router.post("/public/stalls/:id/pay", paymentController.initiateStallPayment);


// 9️⃣ Check today's attendance status for a stall
router.get("/public/stalls/:id/attendance-today", paymentController.getTodayAttendance);

module.exports = router;

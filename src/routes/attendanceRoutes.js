const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");

/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: Attendance management for stalls
 */

/**
 * @swagger
 * /attendance/{stallId}:
 *   post:
 *     summary: Create attendance record for a stall
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: stallId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Stall ID to create attendance for
 *     responses:
 *       201:
 *         description: Attendance created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 stallId:
 *                   type: integer
 *                 date:
 *                   type: string
 *                   format: date
 *                 status:
 *                   type: string
 *                   enum: [PAID, UNPAID]
 *                 amount:
 *                   type: number
 *       400:
 *         description: Invalid stall ID or already paid
 */
router.post("/:stallId", attendanceController.createAttendance);

/**
 * @swagger
 * /attendance/{attendanceId}:
 *   put:
 *     summary: Update attendance (e.g. mark as PAID)
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: attendanceId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PAID, UNPAID]
 *     responses:
 *       200:
 *         description: Attendance updated successfully
 *       400:
 *         description: Attendance not found or invalid data
 */
router.put("/:attendanceId", attendanceController.updateAttendance);

/**
 * @swagger
 * /attendance/{attendanceId}:
 *   delete:
 *     summary: Delete attendance record
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: attendanceId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Attendance deleted successfully
 *       400:
 *         description: Attendance not found
 */
router.delete("/:attendanceId", attendanceController.deleteAttendance);

module.exports = router;

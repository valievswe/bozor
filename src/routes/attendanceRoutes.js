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
 * /attendance:
 *   get:
 *     summary: Get all attendance records with optional filters
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: stallId
 *         schema:
 *           type: integer
 *         description: Filter by stall ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PAID, UNPAID]
 *         description: Filter by payment status
 *     responses:
 *       200:
 *         description: List of attendance records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get("/", attendanceController.getAllAttendances);

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

/**
 * @swagger
 * /attendance/by-date:
 *   get:
 *     summary: Get all stalls with attendance status for a specific date
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to get attendance for (defaults to today)
 *     responses:
 *       200:
 *         description: List of stalls with attendance status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get("/by-date", attendanceController.getAttendanceByDate);

/**
 * @swagger
 * /attendance/bulk:
 *   post:
 *     summary: Create attendance records for all stalls on a date
 *     tags: [Attendance]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Bulk attendance created successfully
 */
router.post("/bulk", attendanceController.bulkCreateAttendance);

/**
 * @swagger
 * /attendance/bulk-update:
 *   put:
 *     summary: Update multiple attendance records at once
 *     tags: [Attendance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     attendanceId:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       enum: [PAID, UNPAID]
 *     responses:
 *       200:
 *         description: Bulk update successful
 */
router.put("/bulk-update", attendanceController.bulkUpdateAttendance);

/**
 * @swagger
 * /attendance/mark-all-paid:
 *   post:
 *     summary: Mark all attendance as paid for a specific date
 *     tags: [Attendance]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: All attendance marked as paid
 */
router.post("/mark-all-paid", attendanceController.markAllPaid);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Stalls
 *   description: Manage market stalls (rasta)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Stall:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         stallNumber:
 *           type: string
 *           example: "S3-ab12cd"
 *         area:
 *           type: number
 *           example: 25
 *         description:
 *           type: string
 *           example: "Fresh fruits and vegetables stall"
 *         sectionId:
 *           type: integer
 *           example: 3
 *         saleTypeId:
 *           type: integer
 *           example: 2
 *         dailyFee:
 *           type: number
 *           example: 50000
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-10-21T09:45:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-10-21T09:45:00.000Z"
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Rasta topilmadi."
 */

/**
 * @swagger
 * /stalls:
 *   post:
 *     summary: Create a new stall
 *     tags: [Stalls]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - area
 *               - sectionId
 *               - saleTypeId
 *             properties:
 *               stallNumber:
 *                 type: string
 *                 example: "S1-abc123"
 *               area:
 *                 type: number
 *                 example: 20
 *               description:
 *                 type: string
 *                 example: "Selling local fruits"
 *               sectionId:
 *                 type: integer
 *                 example: 1
 *               saleTypeId:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Stall created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stall'
 *       400:
 *         description: Validation or business rule error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /stalls:
 *   get:
 *     summary: Get all stalls (optionally filtered by search term)
 *     tags: [Stalls]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Optional search term for stallNumber
 *     responses:
 *       200:
 *         description: List of stalls
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Stall'
 *       400:
 *         description: Error fetching stalls
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /stalls/{id}:
 *   get:
 *     summary: Get stall by ID
 *     tags: [Stalls]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Stall ID
 *     responses:
 *       200:
 *         description: Stall found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stall'
 *       404:
 *         description: Stall not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /stalls/{id}:
 *   put:
 *     summary: Update stall information
 *     tags: [Stalls]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Stall ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stallNumber:
 *                 type: string
 *                 example: "S3-xyz987"
 *               area:
 *                 type: number
 *                 example: 25
 *               description:
 *                 type: string
 *                 example: "Updated stall description"
 *               sectionId:
 *                 type: integer
 *                 example: 2
 *               saleTypeId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Stall updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stall'
 *       400:
 *         description: Update failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /stalls/{id}:
 *   delete:
 *     summary: Delete a stall
 *     tags: [Stalls]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Stall ID
 *     responses:
 *       200:
 *         description: Stall deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Stall deleted successfully"
 *       400:
 *         description: Delete failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

const express = require("express");
const router = express.Router();
const stallController = require("../controllers/stallControllers  ");

router.post("/", stallController.createStall);
router.get("/", stallController.getAllStalls);
router.get("/:id", stallController.getStallById);
router.put("/:id", stallController.updateStall);
router.delete("/:id", stallController.deleteStall);

module.exports = router;

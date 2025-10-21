const express = require("express");
const router = express.Router();
const SaleTypeController = require("../controllers/saleTypeController");

/**
 * @swagger
 * tags:
 *   name: SaleType
 *   description: Manage sale types and taxes
 */

/**
 * @swagger
 * /sale-types:
 *   get:
 *     summary: Get all sale types
 *     tags: [SaleType]
 *     responses:
 *       200:
 *         description: List of all sale types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   tax:
 *                     type: number
 *       500:
 *         description: Server error
 */
router.get("/", SaleTypeController.getAll.bind(SaleTypeController));

/**
 * @swagger
 * /sale-types/{id}:
 *   get:
 *     summary: Get a sale type by ID
 *     tags: [SaleType]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: SaleType ID
 *     responses:
 *       200:
 *         description: SaleType found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 tax:
 *                   type: number
 *       404:
 *         description: SaleType not found
 *       500:
 *         description: Server error
 */
router.get("/:id", SaleTypeController.getById.bind(SaleTypeController));

/**
 * @swagger
 * /sale-types:
 *   post:
 *     summary: Create a new sale type
 *     tags: [SaleType]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - tax
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Retail"
 *               description:
 *                 type: string
 *                 example: "Retail sale type"
 *               tax:
 *                 type: number
 *                 example: 2.5
 *     responses:
 *       201:
 *         description: SaleType created successfully
 *       400:
 *         description: Invalid data
 */
router.post("/", SaleTypeController.create.bind(SaleTypeController));

/**
 * @swagger
 * /sale-types/{id}:
 *   put:
 *     summary: Update an existing sale type
 *     tags: [SaleType]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: SaleType ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Wholesale"
 *               description:
 *                 type: string
 *                 example: "Updated wholesale type"
 *               tax:
 *                 type: number
 *                 example: 3.0
 *     responses:
 *       200:
 *         description: SaleType updated successfully
 *       400:
 *         description: Invalid data
 *       404:
 *         description: SaleType not found
 */
router.put("/:id", SaleTypeController.update.bind(SaleTypeController));

/**
 * @swagger
 * /sale-types/{id}:
 *   delete:
 *     summary: Delete a sale type
 *     tags: [SaleType]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: SaleType ID
 *     responses:
 *       200:
 *         description: SaleType deleted successfully
 *       400:
 *         description: Error while deleting
 */
router.delete("/:id", SaleTypeController.remove.bind(SaleTypeController));

module.exports = router;

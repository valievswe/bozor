const express = require("express");
const SectionController = require("../controllers/sectionController.js");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Section
 *   description: Manage pavilions or market rows (sections)
 */

/**
 * @swagger
 * /sections:
 *   post:
 *     summary: Create a new section
 *     tags: [Section]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Pavilion A"
 *               description:
 *                 type: string
 *                 example: "Main front section of the market"
 *     responses:
 *       201:
 *         description: Section created successfully
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
 *       500:
 *         description: Failed to create section
 */
router.post("/", SectionController.create);

/**
 * @swagger
 * /sections:
 *   get:
 *     summary: Get all sections (with stalls)
 *     tags: [Section]
 *     responses:
 *       200:
 *         description: List of all sections
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
 *                   stalls:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         stallNumber:
 *                           type: string
 *                         area:
 *                           type: number
 *                         dailyFee:
 *                           type: number
 *       500:
 *         description: Failed to fetch sections
 */
router.get("/", SectionController.getAll);

/**
 * @swagger
 * /sections/{id}:
 *   get:
 *     summary: Get a section by ID (with stalls)
 *     tags: [Section]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Section ID
 *     responses:
 *       200:
 *         description: Section found
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
 *                 stalls:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       stallNumber:
 *                         type: string
 *                       area:
 *                         type: number
 *                       dailyFee:
 *                         type: number
 *       404:
 *         description: Section not found
 *       500:
 *         description: Failed to fetch section
 */
router.get("/:id", SectionController.getById);

/**
 * @swagger
 * /sections/{id}:
 *   patch:
 *     summary: Update section information
 *     tags: [Section]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Section ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Pavilion A"
 *               description:
 *                 type: string
 *                 example: "Updated section details"
 *     responses:
 *       200:
 *         description: Section updated successfully
 *       500:
 *         description: Failed to update section
 */
router.patch("/:id", SectionController.update);

/**
 * @swagger
 * /sections/{id}:
 *   delete:
 *     summary: Delete a section by ID
 *     tags: [Section]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Section ID
 *     responses:
 *       200:
 *         description: Section deleted successfully
 *       500:
 *         description: Failed to delete section
 */
router.delete("/:id", SectionController.delete);

module.exports = router;

const express = require("express");
const router = express.Router();
const materialController = require("../controllers/materialController");
const auth = require("../middleware/authMiddleware");
const uploadFile = require("../middleware/uploadFile");

/**
 * @swagger
 * tags:
 *   name: Materials
 *   description: Material management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Material:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated ID of the material
 *         ownerId:
 *           type: string
 *           description: ID of the user who owns this material
 *         title:
 *           type: string
 *           description: Title of the material
 *         type:
 *           type: string
 *           enum: [text, pdf, video, slide]
 *           description: Type of material
 *         filePath:
 *           type: string
 *           description: Path to the uploaded file
 *         processedContent:
 *           type: string
 *           description: Processed text content from the material
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/materials/upload:
 *   post:
 *     summary: Upload a PDF material for quiz generation
 *     description: Upload a PDF file that can be used to generate AI-powered quizzes. The file will be stored on the server and metadata saved to database.
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - file
 *             properties:
 *               title:
 *                 type: string
 *                 description: Descriptive title for the material
 *                 example: "Java OOP Tutorial - Chapter 1"
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF file to upload (max 10MB)
 *               processedContent:
 *                 type: string
 *                 description: Optional pre-processed text content from the PDF
 *                 example: "This document covers basic concepts of Object-Oriented Programming..."
 *     responses:
 *       201:
 *         description: Material uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Material'
 *             example:
 *               _id: "64fa0c1e23abc1234def5679"
 *               ownerId: "64fa0c1e23abc1234def5678"
 *               title: "Java OOP Tutorial - Chapter 1"
 *               type: "pdf"
 *               filePath: "uploads/materials/1632123456789-java-oop.pdf"
 *               processedContent: ""
 *               createdAt: "2023-09-08T10:30:00.000Z"
 *               updatedAt: "2023-09-08T10:30:00.000Z"
 *       400:
 *         description: Bad request - missing file, invalid format, or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             examples:
 *               missingFile:
 *                 value:
 *                   error: "Please upload a PDF file"
 *               invalidFormat:
 *                 value:
 *                   error: "Only PDF files are allowed"
 *               missingTitle:
 *                 value:
 *                   error: "Title is required"
 *       401:
 *         description: Unauthorized - invalid or missing JWT token
 *       500:
 *         description: Server error
 */
// router.post("/upload", auth, materialController.uploadMaterial);

router.post("/upload", auth, uploadFile, materialController.uploadMaterial);

/**
 * @swagger
 * /api/materials:
 *   get:
 *     summary: Get all materials owned by the current user (with filter & search)
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [text, pdf, video, slide]
 *         description: Filter materials by type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search materials by title or processedContent
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of materials
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Material'
 */
router.get("/", auth, materialController.getMyMaterials);


/**
 * @swagger
 * /api/materials/{id}:
 *   get:
 *     summary: Get material by ID
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Material ID
 *     responses:
 *       200:
 *         description: Material details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Material'
 *       404:
 *         description: Material not found
 *       403:
 *         description: Not authorized to view this material
 */
router.get("/:id", auth, materialController.getMaterialById);

/**
 * @swagger
 * /api/materials/{id}:
 *   delete:
 *     summary: Delete material by ID
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Material ID
 *     responses:
 *       200:
 *         description: Material deleted successfully
 *       404:
 *         description: Material not found
 *       403:
 *         description: Not authorized to delete this material
 */
router.delete("/:id", auth, materialController.deleteMaterial);

module.exports = router;

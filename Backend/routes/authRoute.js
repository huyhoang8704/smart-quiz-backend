const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware').authorize;

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & Authorization
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           example: "Nguyen Van A"
 *         email:
 *           type: string
 *           example: "hoang@gmail.com"
 *         password:
 *           type: string
 *           example: "123456"
 *         phone:
 *           type: string
 *           example: "0912345678"
 */

/**
 * @swagger
 * /api/auth/register/student:
 *   post:
 *     summary: Register new student
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Student registered successfully
 *       400:
 *         description: Email already exists
 */
router.post('/register/student', AuthController.registerStudent);

/**
 * @swagger
 * /api/auth/register/teacher:
 *   post:
 *     summary: Register new teacher (Admin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Teacher registered successfully
 *       400:
 *         description: Email already exists
 *       401:
 *         description: Unauthorized
 */
router.post('/register/teacher', auth, authorize('admin'), AuthController.registerTeacher);

/**
 * @swagger
 * /api/auth/register/admin:
 *   post:
 *     summary: Register new admin (Admin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Admin registered successfully
 *       400:
 *         description: Email already exists
 *       401:
 *         description: Unauthorized
 */
router.post('/register/admin', auth, authorize('admin'), AuthController.registerAdmin);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "hoang@gmail.com"
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 */
router.post('/login', AuthController.login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current logged-in user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user info
 *       401:
 *         description: Unauthorized
 */
router.get('/me', auth, AuthController.me);

module.exports = router;

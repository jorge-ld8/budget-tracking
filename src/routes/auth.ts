import type { AuthController } from '../types/controllers.ts';
import rateLimiter from 'express-rate-limit';
import { authenticate } from '../middlewares/auth.ts';
import { Router } from 'express';
import { registerSchema, loginSchema, changePasswordSchema } from '../validators/auth.validator.ts';
import { z } from 'zod';
import { validateRequest } from '../middlewares/validateRequest.ts';
const limiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 3, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
});
/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: API endpoints for user authentication
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:  
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: User's username
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *         - currency
 *       properties:
 *         username:
 *           type: string
 *           description: Desired username
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *         currency:
 *           type: string
 *           enum: [USD, EUR, GBP, CAD, AUD, NZD, CHF, JPY, CNY, INR, BRL, ARS, CLP, COP, MXN, PEN, PYG, UYU, VND, ZAR]
 *           description: User's preferred currency
 *     ChangePasswordRequest:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           format: password
 *           description: Current password
 *         newPassword:
 *           type: string
 *           format: password
 *           description: New password
 */

class AuthRouter {
    private router: Router;
    private controller: AuthController;

    constructor(controller: AuthController) {
        this.router = Router();
        this.controller = controller;
        this.initializeRoutes();
    }

    getRouter() {
        return this.router;
    }

    async initializeRoutes() {
        /**
         * @swagger
         * /auth/register:
         *   post:
         *     summary: Register a new user
         *     tags: [Authentication]
         *     security: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/RegisterRequest'
         *     responses:
         *       201:
         *         description: User successfully registered
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 token:
         *                   type: string
         *                   description: JWT token
         *                 user:
         *                   $ref: '#/components/schemas/User'
         *       400:
         *         description: Invalid input data
         *       409:
         *         description: Username or email already exists
         */
        this.router.post('/register', limiter, 
            validateRequest(z.object({ body: registerSchema })) as any, 
            this.controller.register);

        /**
         * @swagger
         * /auth/login:
         *   post:
         *     summary: Login to get access token
         *     tags: [Authentication]
         *     security: []  # No security needed for login
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required:
         *               - email
         *               - password
         *             properties:
         *               email:
         *                 type: string
         *                 description: Email
         *               password:
         *                 type: string
         *                 format: password
         *                 description: Password
         *           examples:
         *             example1:
         *               value:
         *                 email: Keith_White@yahoo.com
         *                 password: jorge_1234
         *     responses:
         *       200:
         *         description: Successful login
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 token:
         *                   type: string
         *                   description: JWT token
         *                 user:
         *                   $ref: '#/components/schemas/User'
         *       401:
         *         description: Invalid credentials
         */
        this.router.post('/login', limiter, 
            validateRequest(z.object({ body: loginSchema })) as any, 
            this.controller.login);

        /**
         * @swagger
         * /auth/logout:
         *   post:
         *     summary: Logout and invalidate token
         *     tags: [Authentication]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: Successfully logged out
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 message:
         *                   type: string
         *                   example: Logged out successfully
         *       401:
         *         description: Unauthorized
         */
        this.router.post('/logout', authenticate as any, this.controller.logout);

        /**
         * @swagger
         * /auth/current-user:
         *   get:
         *     summary: Get current user information
         *     tags: [Authentication]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: Current user information
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 user:
         *                   $ref: '#/components/schemas/User'
         *       401:
         *         description: Unauthorized
         */
        this.router.get('/current-user', authenticate as any, this.controller.getCurrentUser);

        /**
         * @swagger
         * /auth/change-password:
         *   post:
         *     summary: Change user password
         *     tags: [Authentication]
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/ChangePasswordRequest'
         *     responses:
         *       200:
         *         description: Password changed successfully
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 message:
         *                   type: string
         *                   example: Password changed successfully
         *       400:
         *         description: Invalid current password
         *       401:
         *         description: Unauthorized
         */
        this.router.post('/change-password', authenticate as any, 
            validateRequest(z.object({ body: changePasswordSchema })) as any, 
            this.controller.changePassword);
    }
}

export default AuthRouter;
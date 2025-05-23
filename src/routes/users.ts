import { BaseRouter } from '../interfaces/BaseRouter.ts';
import { authenticate, isAdmin } from '../middlewares/auth.ts';
import { validateRequest } from '../middlewares/validateRequest.ts';
import { idSchema, createUserSchema, updateUserSchema } from '../validators/users.validator.ts';
import type { UserController } from '../types/controllers.ts';
import { z } from 'zod';
import type { RequestHandler } from 'express';


/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *         - currency
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         username:
 *           type: string
 *           description: User's unique username
 *         email:
 *           type: string
 *           description: User's email address
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
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Update timestamp
 *         isDeleted:
 *           type: boolean
 *           description: Whether the user is soft deleted
 */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management API
 */

class UsersRouter extends BaseRouter<UserController> {
    initializeRoutes() : void{
        this.router.use(authenticate);
        this.router.use(isAdmin);

        /**
         * @swagger
         * /users:
         *   get:
         *     summary: Returns a list of users
         *     tags: [Users]
         *     parameters:
         *       - in: query
         *         name: currency
         *         schema:
         *           type: string
         *         description: Filter by currency
         *       - in: query
         *         name: name
         *         schema:
         *           type: string
         *         description: Search by name, username, or email
         *       - in: query
         *         name: sort
         *         schema:
         *           type: string
         *         description: Sort fields (comma separated)
         *       - in: query
         *         name: fields
         *         schema:
         *           type: string
         *         description: Select specific fields (comma separated)
         *       - in: query
         *         name: page
         *         schema:
         *           type: integer
         *         description: Page number
         *       - in: query
         *         name: limit
         *         schema:
         *           type: integer
         *         description: Items per page
         *       - in: query
         *         name: includeDeleted
         *         schema:
         *           type: boolean
         *         description: Include soft-deleted users
         *     responses:
         *       200:
         *         description: The list of users
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 users:
         *                   type: array
         *                   items:
         *                     $ref: '#/components/schemas/User'
         *                 nbHits:
         *                   type: integer
         *                 page:
         *                   type: integer
         *                 limit:
         *                   type: integer
         *                 totalPages:
         *                   type: integer
         */
        this.router.get('/', (req, res, next) => this.controller.getAll(req, res, next));

        /**
         * @swagger
         * /users/{id}:
         *   get:
         *     summary: Get a user by ID
         *     tags: [Users]
         *     parameters:
         *       - in: path
         *         name: id
         *         schema:
         *           type: string
         *         required: true
         *         description: The user ID
         *     responses:
         *       200:
         *         description: The user details
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 user:
         *                   $ref: '#/components/schemas/User'
         *       404:
         *         description: User not found
         */
        this.router.get('/:id', 
            validateRequest(z.object({ params: idSchema })),
            (req, res, next) => this.controller.getById(req, res, next));

        /**
         * @swagger
         * /users:
         *   post:
         *     summary: Create a new user
         *     tags: [Users]
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required:
         *               - username
         *               - email
         *               - password
         *               - firstName
         *               - lastName
         *               - currency
         *             properties:
         *               username:
         *                 type: string
         *               email:
         *                 type: string
         *               password:
         *                 type: string
         *               firstName:
         *                 type: string
         *               lastName:
         *                 type: string
         *               currency:
         *                 type: string
         *                 enum: [USD, EUR, GBP, CAD, AUD, NZD, CHF, JPY, CNY, INR, BRL, ARS, CLP, COP, MXN, PEN, PYG, UYU, VND, ZAR]
         *     responses:
         *       201:
         *         description: Created
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 user:
         *                   $ref: '#/components/schemas/User'
         */
        this.router.post('/', 
            validateRequest(z.object({ body: createUserSchema })),
            (req, res, next) => this.controller.create(req, res, next));

        /**
         * @swagger
         * /users/{id}:
         *   patch:
         *     summary: Update a user
         *     tags: [Users]
         *     parameters:
         *       - in: path
         *         name: id
         *         schema:
         *           type: string
         *         required: true
         *         description: The user ID
         *     requestBody:
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               username:
         *                 type: string
         *               email:
         *                 type: string
         *               password:
         *                 type: string
         *               firstName:
         *                 type: string
         *               lastName:
         *                 type: string
         *     responses:
         *       200:
         *         description: Updated
         *       404:
         *         description: User not found
         */
        this.router.patch('/:id', 
            validateRequest(z.object({ params: idSchema, body: updateUserSchema })),
            (req, res, next) => this.controller.update(req, res, next));

        /**
         * @swagger
         * /users/{id}:
         *   delete:
         *     summary: Soft delete a user
         *     tags: [Users]
         *     parameters:
         *       - in: path
         *         name: id
         *         schema:
         *           type: string
         *         required: true
         *         description: The user ID
         *     responses:
         *       200:
         *         description: User soft deleted successfully
         *       404:
         *         description: User not found
         */
        this.router.delete('/:id', 
            validateRequest(z.object({ params: idSchema })),
            (req, res, next) => this.controller.delete(req, res, next));
        
        /**
         * @swagger
         * /users/deleted/all:
         *   get:
         *     summary: Get all deleted users
         *     tags: [Users]
         *     responses:
         *       200:
         *         description: List of deleted users
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 deletedUsers:
         *                   type: array
         *                   items:
         *                     $ref: '#/components/schemas/User'
         *                 count:
         *                   type: integer
         */
        this.router.get('/deleted/all', (req, res, next) => this.controller.getDeleted(req, res, next));

        /**
         * @swagger
         * /users/{id}/restore:
         *   post:
         *     summary: Restore a deleted user
         *     tags: [Users]
         *     parameters:
         *       - in: path
         *         name: id
         *         schema:
         *           type: string
         *         required: true
         *         description: The user ID
         *     responses:
         *       200:
         *         description: User restored successfully
         *       400:
         *         description: User is not deleted
         *       404:
         *         description: User not found
         */
        this.router.post('/:id/restore', 
            validateRequest(z.object({ params: idSchema })),
            (req, res, next) => this.controller.restore(req, res, next));
    }
}

export default UsersRouter;
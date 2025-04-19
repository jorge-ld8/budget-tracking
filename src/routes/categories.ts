import { authenticate } from '../middlewares/auth.ts';
import type { CategoryController } from '../types/controllers.ts';
import { BaseRouter } from '../interfaces/BaseRouter.ts';
import { validateRequest } from '../middlewares/validateRequest.ts';
import { createCategorySchema, updateCategorySchema, idSchema, typeSchema } from '../validators/categories.validator.ts';
import { z } from 'zod';

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - user
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         name:
 *           type: string
 *           description: Category name
 *         type:
 *           type: string
 *           enum: [income, expense]
 *           description: Category type
 *         icon:
 *           type: string
 *           description: Icon identifier for UI
 *           default: default-icon
 *         color:
 *           type: string
 *           description: Color hex code (e.g., #FF5733)
 *           default: '#000000'
 *         user:
 *           type: string
 *           description: Reference to user ID who owns this category
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
 *           description: Whether the category is soft deleted
 */

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management API
 */

class CategoriesRouter extends BaseRouter<CategoryController> {
  constructor(controller: CategoryController) {
    super(controller);
  }

  async initializeRoutes() {
    this.router.use(authenticate as any);

    /**
     * @swagger
     * /categories:
     *   get:
     *     summary: Returns a list of categories
     *     tags: [Categories]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: type
     *         schema:
     *           type: string
     *           enum: [income, expense]
     *         description: Filter by category type
     *       - in: query
     *         name: name
     *         schema:
     *           type: string
     *         description: Search by category name
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
     *     responses:
     *       200:
     *         description: The list of categories
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 categories:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Category'
     *                 nbHits:
     *                   type: integer
     *                 page:
     *                   type: integer
     *                 limit:
     *                   type: integer
     *                 totalPages:
     *                   type: integer
     */
    this.router.get('/', this.controller.getAll);

    /**
     * @swagger
     * /categories:
     *   post:
     *     summary: Create a new category
     *     tags: [Categories]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *               - type
     *             properties:
     *               name:
     *                 type: string
     *               type:
     *                 type: string
     *                 enum: [income, expense]
     *               icon:
     *                 type: string
     *               color:
     *                 type: string
     *     responses:
     *       201:
     *         description: Created
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 category:
     *                   $ref: '#/components/schemas/Category'
     */
    this.router.post('/', 
      validateRequest(z.object({ body: createCategorySchema })) as any, 
      this.controller.create);
    
    /**
     * @swagger
     * /categories/deleted:
     *   get:
     *     summary: Get all soft-deleted categories
     *     tags: [Categories]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of soft-deleted categories
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 deletedCategories:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Category'
     *                 count:
     *                   type: integer
     */
    this.router.get('/deleted', this.controller.getDeleted);

    /**
     * @swagger
     * /categories/type/{type}:
     *   get:
     *     summary: Get categories by type (income or expense)
     *     tags: [Categories]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: type
     *         schema:
     *           type: string
     *           enum: [income, expense]
     *         required: true
     *         description: The category type
     *     responses:
     *       200:
     *         description: List of categories of the specified type
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 categories:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Category'
     *                 count:
     *                   type: integer
     *       400:
     *         description: Invalid category type
     */
    this.router.get('/type/:type', 
      validateRequest(z.object({ params: typeSchema })) as any, 
      this.controller.getByType);

    /**
     * @swagger
     * /categories/{id}:
     *   get:
     *     summary: Get a category by ID
     *     tags: [Categories]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *         required: true
     *         description: The category ID
     *     responses:
     *       200:
     *         description: The category details
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 category:
     *                   $ref: '#/components/schemas/Category'
     *       404:
     *         description: Category not found
     */
    this.router.get('/:id', 
      validateRequest(z.object({ params: idSchema })) as any, 
      this.controller.getById);

    /**
     * @swagger
     * /categories/{id}:
     *   patch:
     *     summary: Update a category
     *     tags: [Categories]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *         required: true
     *         description: The category ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *               type:
     *                 type: string
     *                 enum: [income, expense]
     *               icon:
     *                 type: string
     *               color:
     *                 type: string
     *     responses:
     *       200:
     *         description: Updated
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 category:
     *                   $ref: '#/components/schemas/Category'
     *       404:
     *         description: Category not found
     */
    this.router.patch('/:id', 
      validateRequest(z.object({ params: idSchema, body: updateCategorySchema })) as any, 
      this.controller.update);

    /**
     * @swagger
     * /categories/{id}:
     *   delete:
     *     summary: Soft delete a category
     *     tags: [Categories]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *         required: true
     *         description: The category ID
     *     responses:
     *       200:
     *         description: Category soft deleted successfully
     *       404:
     *         description: Category not found
     *       400:
     *         description: Category is already deleted
     */
    this.router.delete('/:id', 
      validateRequest(z.object({ params: idSchema })) as any, 
      this.controller.delete);

    /**
     * @swagger
     * /categories/{id}/restore:
     *   patch:
     *     summary: Restore a soft-deleted category
     *     tags: [Categories]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *         required: true
     *         description: The category ID
     *     responses:
     *       200:
     *         description: Category restored successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                 category:
     *                   $ref: '#/components/schemas/Category'
     *       404:
     *         description: Category not found
     *       400:
     *         description: Category is not deleted
     */
    this.router.patch('/:id/restore', 
      validateRequest(z.object({ params: idSchema })) as any, 
      this.controller.restore);
  }
}

export default CategoriesRouter;
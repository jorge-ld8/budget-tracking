import type { NextFunction, Response } from 'express';
import AuthService from '../services/AuthService.ts';
import { BadRequestError } from '../errors/index.ts';
import type { AuthController as IAuthController } from '../types/controllers.ts';
import type { AuthenticatedRequest } from '../types/index.d.ts';
import type { ChangePasswordDto, LoginDto, RegisterDto } from '../types/dtos/auth.dto.ts';

class AuthController implements IAuthController {
    private readonly authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    async register(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const registerData: RegisterDto = req.body;

            // Basic validation
            if (!registerData.username || !registerData.email || !registerData.password || !registerData.firstName || !registerData.lastName) {
                throw new BadRequestError('Missing required fields: username, email, password, firstName, lastName');
            }

            const result = await this.authService.register(registerData);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    async login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const loginData: LoginDto = req.body;

            // Basic validation
            if (!loginData.email || !loginData.password) {
                throw new BadRequestError('Missing required fields: email and password');
            }

            const result = await this.authService.login(loginData);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async getCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user?._id) {
                throw new BadRequestError('User authentication information is missing.');
            }

            const userId = req.user._id.toString();
            const user = await this.authService.getCurrentUser(userId);
            res.status(200).json({ user });
        } catch (error) {
            next(error);
        }
    }

    async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user?._id) {
                throw new BadRequestError('User authentication information is missing.');
            }

            const userId = req.user._id.toString();
            const passwordData: ChangePasswordDto = req.body;

            // Basic validation
            if (!passwordData.currentPassword || !passwordData.newPassword) {
                throw new BadRequestError('Missing required fields: currentPassword and newPassword');
            }

            await this.authService.changePassword(userId, passwordData);
            res.status(200).json({
                success: true,
                message: 'Password updated successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            // For JWT, client-side should remove the token
            // Here we can add any server-side cleanup if needed
            res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}

export default AuthController;

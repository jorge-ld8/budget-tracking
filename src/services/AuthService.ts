import mongoose, { Types } from 'mongoose';
import User from '../models/users.ts';
import type { IUser } from '../types/models/user.types.ts';
import type { AuthResponseDto, ChangePasswordDto, LoginDto, RegisterDto, UserProfileDto } from '../types/dtos/auth.dto.ts';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../errors/index.ts';

class AuthService {

    async register(data: RegisterDto): Promise<AuthResponseDto> {
        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email: data.email }, { username: data.username }] });
        if (existingUser) {
            throw new BadRequestError('User with this email or username already exists');
        }

        // Create new user
        const user = new User({
            ...data,
            currency: data.currency || 'USD'
        });

        await user.save();

        // Generate token
        const token = user.generateAuthToken();

        // Return user info without password
        const userObj : any = user.toObject();
        delete userObj.password;

        return {
            token,
            user: userObj as AuthResponseDto["user"]
        };
    }

    async login(data: LoginDto): Promise<AuthResponseDto> {
        // Check if user exists
        const user = await User.findOne({ email: data.email });
        if (!user) {
            throw new UnauthorizedError('Invalid credentials');
        }

        // Check password
        const isMatch = await user.comparePassword(data.password);
        if (!isMatch) {
            throw new UnauthorizedError('Invalid credentials');
        }

        // Update last login (if field exists)
        (user as any).lastLogin = Date.now();
        await user.save();

        // Generate token
        const token = user.generateAuthToken();

        // Return user info without password
        const userObj : any = user.toObject();
        delete userObj.password;

        return {
            token,
            user: userObj as AuthResponseDto['user']
        };
    }

    async changePassword(userId: string, data: ChangePasswordDto): Promise<void> {
        const user = await User.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Verify current password
        const isMatch = await user.comparePassword(data.currentPassword);
        if (!isMatch) {
            throw new UnauthorizedError('Current password is incorrect');
        }

        // Update password
        user.password = data.newPassword;
        await user.save();
    }

    async getCurrentUser(userId: string): Promise<UserProfileDto> {
        const user = await User.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        const userObj : any = user.toObject();
        delete userObj.password;

        return userObj as UserProfileDto;
    }
}

export default AuthService; 
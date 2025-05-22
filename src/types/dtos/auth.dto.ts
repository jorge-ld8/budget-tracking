// DTO for user registration
export interface RegisterDto {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    currency?: string;
}

// DTO for user login
export interface LoginDto {
    email: string;
    password: string;
}

// DTO for changing password
export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}

// DTO for auth response
export interface AuthResponseDto {
    token: string;
    user: {
        _id: string;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
        currency: string;
        isAdmin: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
}

// DTO for user profile response
export interface UserProfileDto {
    _id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    currency: string;
    isAdmin: boolean;
    createdAt: Date;
    updatedAt: Date;
} 
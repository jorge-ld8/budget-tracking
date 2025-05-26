// DTO for querying users
export interface UserQueryFiltersDto {
    currency?: string;
    name?: string; // For regex search across username, email, firstName, lastName
    sort?: string;
    fields?: string;
    page?: number;
    limit?: number;
    numericFilters?: string;
    includeDeleted?: boolean;
}

// DTO for creating a new user
export interface CreateUserDto {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    currency: string;
    isAdmin?: boolean;
}

// DTO for updating an existing user
export interface UpdateUserDto {
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    currency?: string;
    isAdmin?: boolean;
}

// DTO for admin updates (might include more fields)
export interface UpdateUserAdminDto extends UpdateUserDto {
    isActive?: boolean;
}

// DTO for changing password
export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}

// DTO for user response (without sensitive data)
export interface UserResponseDto {
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
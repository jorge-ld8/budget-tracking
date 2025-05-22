import mongoose from 'mongoose';

// T: The Mongoose document type (e.g., IAccountSchema)
// C: The DTO type for creating the entity (e.g., CreateAccountDto)
// U: The DTO type for updating the entity (e.g., UpdateAccountDto)
// Q: The DTO type for query filters (e.g., AccountQueryFiltersDto)
export interface IBaseService<T, C, U, Q> {
    getAll(userId: string | null, filters: Q): Promise<{ items: T[], totalDocuments: number }>;
    findById(id: string, userId: string | null): Promise<T>;
    create(userId: string, data: C, ...args: any[]): Promise<T>; // Added ...args for flexibility
    update(id: string, userId: string, data: U): Promise<T>;
    delete(id: string, userId: string | null): Promise<mongoose.Types.ObjectId>;
    restore(id: string, userId: string | null): Promise<T>;
    getDeleted(userId: string | null): Promise<T[]>;
}

// Optional: Interface for common admin operations if needed later
// export interface IAdminBaseService<T, CAdmin, UAdmin> {
//     createAdmin(data: CAdmin, ...args: any[]): Promise<T>;
//     updateAdmin(id: string, data: UAdmin): Promise<T>;
// } 
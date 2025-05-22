// src/types/mongoose-delete.d.ts

declare module 'mongoose-delete' {
    import mongoose = require('mongoose');

    interface SoftDeleteOptions {
        deletedAt?: boolean;
        deletedBy?: boolean;
        overrideMethods?: boolean | 'all' | string[];
        validateBeforeDelete?: boolean;
        indexFields?: boolean | string[];
        use$neOperator?: boolean;
    }

    export interface SoftDeleteDocument extends mongoose.Document {
        deleted?: boolean;
        deletedAt?: Date | null;
        deletedBy?: mongoose.Types.ObjectId | string | null;
        delete(deletedBy?: mongoose.Types.ObjectId | string | null): Promise<this>;
        restore(): Promise<this>;
        softDelete(): Promise<this>; // Added for consistency if used
    }

    export interface SoftDeleteModel<T extends SoftDeleteDocument> extends mongoose.Model<T> {
        findDeleted(query?: any): mongoose.Query<T[], T>;
        findOneDeleted(query?: any): mongoose.Query<T | null, T>;
        findWithDeleted(query?: any): mongoose.Query<T[], T>;
        findOneWithDeleted(query?: any): mongoose.Query<T | null, T>;
        countDeleted(query?: any): Promise<number>;
        countWithDeleted(query?: any): Promise<number>;
        updateDeleted(query: any, update: any, options?: mongoose.QueryOptions): mongoose.Query<any, T>; // Return type might vary
        updateWithDeleted(query: any, update: any, options?: mongoose.QueryOptions): mongoose.Query<any, T>; // Return type might vary
        deleteMany(query?: any, deletedBy?: mongoose.Types.ObjectId | string | null): Promise<{ ok?: number; n?: number; deletedCount?: number }>;
        deleteOne(query?: any, deletedBy?: mongoose.Types.ObjectId | string | null): Promise<{ ok?: number; n?: number; deletedCount?: number }>;
        restoreMany(query?: any): Promise<{ ok?: number; n?: number; nModified?: number }>;
        restoreOne(query?: any): Promise<{ ok?: number; n?: number; nModified?: number }>;
    }

    const mongooseDeletePlugin: (schema: mongoose.Schema, options?: SoftDeleteOptions) => void;

    export default mongooseDeletePlugin;
} 
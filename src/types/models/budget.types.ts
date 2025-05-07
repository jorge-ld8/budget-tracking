import type { Document, Model as MongooseModel, Types, Query } from 'mongoose';
import type { SoftDeleteDocument, SoftDeleteModel } from 'mongoose-delete';
import type { BudgetPeriod } from '../dtos/budget.dto.ts'; // Ensure this path is correct

// Interface for the Budget document
export interface IBudgetSchema extends Document, SoftDeleteDocument {
    user: Types.ObjectId;
    category: Types.ObjectId;
    amount: number;
    period: BudgetPeriod;
    startDate: Date;
    endDate?: Date; // Make endDate explicitly nullable as well
    notes?: string;
    isActive: boolean;
    // Timestamps provided by Mongoose
    createdAt: Date;
    updatedAt: Date;
    // Soft delete fields (deleted, deletedAt) are handled by SoftDeleteDocument
}

// Interface for the Budget model - Manually merge necessary methods from SoftDeleteModel
export interface IBudgetModel extends MongooseModel<IBudgetSchema> { // Extend mongoose.Model directly
    // Manually add methods from SoftDeleteModel<IBudgetSchema> that don't conflict
    // or use the more specific types if they differ from mongoose.Model<IBudgetSchema>
    findDeleted(query?: any): Query<IBudgetSchema[], IBudgetSchema>;
    findOneDeleted(query?: any): Query<IBudgetSchema | null, IBudgetSchema>;
    findWithDeleted(query?: any): Query<IBudgetSchema[], IBudgetSchema>;
    findOneWithDeleted(query?: any): Query<IBudgetSchema | null, IBudgetSchema>;
    countDeleted(query?: any): Promise<number>;
    countWithDeleted(query?: any): Promise<number>;
    // deleteOne, deleteMany, restore, etc., from SoftDeleteDocument are instance methods,
    // so they are covered by IBudgetSchema extending SoftDeleteDocument.
    // Static deleteOne/deleteMany from SoftDeleteModel might conflict with mongoose.Model ones.
    // If specific static soft delete operations are needed (like static restore), they might need careful typing
    // or rely on the instance methods after finding a deleted document.
} 
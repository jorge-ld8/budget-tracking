import { Model, Types } from 'mongoose';

interface IBaseSchema {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  softDelete(): Promise<void>;
  restore(): Promise<void>;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
}

interface IBaseModel<T extends IBaseSchema> extends Model<T> {
    getDeletedUsers(): Promise<T[]>;
    findDeleted({user}?: {user: Types.ObjectId}): Promise<T[]>;
}

export { IBaseModel, IBaseSchema };

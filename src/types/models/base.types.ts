import mongoose, { Document, Model, Types } from 'mongoose';

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

interface IBaseModel extends mongoose.Model<IBaseSchema> {
    getDeletedUsers(): Promise<IBaseSchema[]>;
    findDeleted(): Promise<IBaseSchema[]>;
}

export { IBaseModel, IBaseSchema };

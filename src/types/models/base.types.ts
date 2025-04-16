import { Model, Types } from 'mongoose';

export interface IBaseSchema { 
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  softDelete(): Promise<void>;
  restore(): Promise<void>;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
}

export interface IBaseModel<T extends IBaseSchema> extends Model<T> {
    getDeletedUsers(): Promise<T[]>;
    findDeleted({user}?: {user: Types.ObjectId}): Promise<T[]>;}


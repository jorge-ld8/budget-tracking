import { Model, Types } from 'mongoose';

export interface IBaseSchema { 
  _id: Types.ObjectId;
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
    findDeleted({user, _id}?: {user?: Types.ObjectId, _id?: Types.ObjectId}): Promise<T[]>;}


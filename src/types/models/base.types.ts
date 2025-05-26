import { type Document, type Model, type Types } from 'mongoose';

export interface IBaseSchema extends Document { 
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  softDelete(): Promise<void>;
  restore(): Promise<void>;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
  save(): Promise<this>;
}

export interface IBaseModel<T extends IBaseSchema> extends Model<T> {
    getDeletedUsers(): Promise<Array<IBaseModel<T>>>;
    findDeleted({user, _id}: {user?: Types.ObjectId, _id?: Types.ObjectId}): Promise<IBaseModel<T>>;
}


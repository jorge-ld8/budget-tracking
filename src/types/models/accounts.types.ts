import type { IBaseModel, IBaseSchema } from "./base.types.ts";
import  { type Types } from "mongoose";

export interface IAccountSchema extends IBaseSchema {
    name: string;
    balance: number;
    type: string;
    description: string;
    isActive: boolean;
    user: Types.ObjectId;
  }

  export interface IAccountModel extends IBaseModel<IAccountSchema> {}

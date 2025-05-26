import type { IBaseModel, IBaseSchema } from "./base.types.ts";
import  { type Types } from "mongoose";

export interface ITransactionSchema extends IBaseSchema {
    amount: number;
    type: string;
    description: string;
    date: Date;
    category: Types.ObjectId;
    account: Types.ObjectId;
    imgUrl?: string;
    user: Types.ObjectId;
  }

  export interface ITransactionModel extends IBaseModel<ITransactionSchema>{}

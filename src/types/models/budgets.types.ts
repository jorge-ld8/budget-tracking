import type { IBaseModel, IBaseSchema } from "./base.types.ts";
import  { Types } from "mongoose";

export interface IBudgetSchema extends IBaseSchema {
    amount: number;
    period: string;
    category: Types.ObjectId;
    startDate: Date;
    endDate: Date;
    isRecurring: boolean;
    user: Types.ObjectId;
  }

  export interface IBudgetModel extends IBaseModel<IBudgetSchema> {}

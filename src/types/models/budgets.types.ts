import { IBaseModel, IBaseSchema } from "./base.types";
import { Types } from "mongoose";

interface IBudgetSchema extends IBaseSchema {
    amount: number;
    period: string;
    category: Types.ObjectId;
    startDate: Date;
    endDate: Date;
    isRecurring: boolean;
    user: Types.ObjectId;
  }

  interface IBudgetModel extends IBaseModel<IBudgetSchema> {}

  export { IBudgetSchema as IBudget, IBudgetModel };
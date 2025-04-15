import { IBaseModel, IBaseSchema } from "./base.types";
import { Types } from "mongoose";

interface ITransactionSchema extends IBaseSchema {
    amount: number;
    type: string;
    description: string;
    date: Date;
    category: Types.ObjectId;
    account: Types.ObjectId;
    imgUrl?: string;
    user: Types.ObjectId;
  }

  interface ITransactionModel extends IBaseModel<ITransactionSchema>{}

  export { ITransactionSchema as ITransaction, ITransactionModel };
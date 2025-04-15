import { IBaseModel, IBaseSchema } from "./base.types";
import { Types } from "mongoose";

interface IAccountSchema extends IBaseSchema {
    name: string;
    balance: number;
    type: string;
    description: string;
    isActive: boolean;
    user: Types.ObjectId;
  }

  interface IAccountModel extends IBaseModel<IAccountSchema> {}

  export { IAccountSchema as IAccount, IAccountModel }; 
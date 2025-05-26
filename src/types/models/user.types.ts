import { type IBaseModel, type IBaseSchema } from "./base.types.ts";

export interface IUser extends IBaseSchema {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    currency: string;
    isAdmin: boolean;
  }

export interface IUserModel extends IBaseModel<IUser> {}

import { IBaseModel, IBaseSchema } from "./base.types";

interface IUser extends IBaseSchema {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    currency: string;
    isAdmin: boolean;
  }

  interface IUserModel extends IBaseModel<IUser> {}

  export { IUser, IUserModel };
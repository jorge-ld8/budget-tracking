import { IBaseModel, IBaseSchema } from "./base.types";
import { Types } from "mongoose";

interface ICategorySchema  extends IBaseSchema {
    name: string;
    type: string;
    icon: string;
    color: string;
    user: Types.ObjectId;
  }

  interface ICategoryModel extends IBaseModel<ICategorySchema> {}

  export { ICategorySchema as ICategory, ICategoryModel };
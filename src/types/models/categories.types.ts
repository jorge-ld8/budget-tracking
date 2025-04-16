import type { IBaseModel, IBaseSchema } from "./base.types.ts";
import  { Types } from "mongoose";

export interface ICategorySchema extends IBaseSchema {
    name: string;
    type: string;
    icon: string;
    color: string;
    user: Types.ObjectId;
  }

export interface ICategoryModel extends IBaseModel<ICategorySchema> {}

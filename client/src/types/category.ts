import { Entity } from "./common";
import { TransactionType } from "./transaction";

export interface Category extends Entity {
    name: string;
    type: TransactionType;
    icon: string;
    color: string;
  }

  export interface CategoryFormData {
    name: string;
    type: TransactionType;
    icon: string;
    color: string;
  }
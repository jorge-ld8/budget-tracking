import { Entity } from "./common";

export interface Account extends Entity {
    name: string;
    type: string;
    balance: number;
    description: string;
  }

  export interface AccountFormData {
    name: string;
    type: string;
    balance: number;
    description: string;
  }
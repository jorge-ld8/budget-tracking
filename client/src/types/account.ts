import { Entity } from "./common";

export interface Account extends Entity {
    name: string;
    type: string;
    balance: number;
  }

  export interface AccountFormData {
    name: string;
    type: string;
    balance: number;
  }
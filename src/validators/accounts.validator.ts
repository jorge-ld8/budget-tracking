import { z } from "zod";
import { ACCOUNT_TYPES, BALANCE_OPERATIONS, objectIdRegex } from "../utils/constants.ts";

export const createAccountSchema = z.object({
    name: z.string().min(1),
    type: z.enum(ACCOUNT_TYPES as [string, ...string[]]),
    description: z.string().optional(),
});

export const updateAccountSchema = z.object({
    name: z.string().min(1).optional(),
    type: z.enum(ACCOUNT_TYPES as [string, ...string[]]).optional(),
    description: z.string().optional(),
});

export const idSchema = z.object({
    id: z.string().regex(objectIdRegex, { message: "Invalid account ID" })
});

export const balanceUpdateSchema = z.object({
    amount: z.number().min(0),
    operation: z.enum(BALANCE_OPERATIONS as [string, ...string[]])
});

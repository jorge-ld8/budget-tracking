import { z } from "zod";

const transactionType = z.enum(["income", "expense"]);
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createTransactionSchema = z.object({
    amount: z.coerce.number().min(0),
    date: z.string().date(),
    description: z.string().min(1),
    type: transactionType,
    category: z.string().regex(objectIdRegex, { message: "Invalid category ID" }),
    account: z.string().regex(objectIdRegex, { message: "Invalid account ID" })
});

export const updateTransactionSchema = z.object({
    amount: z.coerce.number().min(0).optional(),
    date: z.string().date().optional(),
    description: z.string().min(1).optional(),
    type: transactionType.optional(),
    category: z.string().regex(objectIdRegex, { message: "Invalid category ID" }).optional(),
    account: z.string().regex(objectIdRegex, { message: "Invalid account ID" }).optional()
});

export const idSchema = z.object({
    id: z.string().regex(objectIdRegex, { message: "Invalid transaction ID" })
});


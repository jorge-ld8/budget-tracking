import { z } from "zod";
import { objectIdRegex, BUDGET_TYPES, TRANSACTION_TYPES } from "../utils/constants.ts";

export const createBudgetSchema = z.object({
    // name: z.string().min(1),
    amount: z.number().min(0),
    startDate: z.string().date(),
    endDate: z.string().date(),
    category: z.string().regex(objectIdRegex, { message: "Invalid category ID" }),
    period: z.enum(BUDGET_TYPES as [string, ...string[]])
});

export const updateBudgetSchema = z.object({
    name: z.string().min(1).optional(),
    amount: z.number().min(0).optional(),
    startDate: z.string().date().optional(),
    endDate: z.string().date().optional(),
    category: z.string().regex(objectIdRegex, { message: "Invalid category ID" }).optional(),
    period: z.enum(BUDGET_TYPES as [string, ...string[]]).optional()
});

export const idSchema = z.object({
    id: z.string().regex(objectIdRegex, { message: "Invalid budget ID" })
});

export const typeSchema = z.object({
    type: z.enum(TRANSACTION_TYPES as [string, ...string[]])
})

export const periodSchema = z.object({
    period: z.enum(BUDGET_TYPES as [string, ...string[]])
})

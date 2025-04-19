import { z } from "zod";
import { objectIdRegex, TRANSACTION_TYPES } from "../utils/constants.ts";

export const createCategorySchema = z.object({
    name: z.string().min(1),
    color: z.string().min(1),
    type: z.enum(TRANSACTION_TYPES as [string, ...string[]]),
    icon: z.string().min(1)

});

export const updateCategorySchema = z.object({
    name: z.string().min(1).optional(),
    color: z.string().min(1).optional(),
    type: z.enum(TRANSACTION_TYPES as [string, ...string[]]).optional(),
    icon: z.string().min(1).optional()
});

export const idSchema = z.object({
    id: z.string().regex(objectIdRegex, { message: "Invalid category ID" })
});

export const typeSchema = z.object({
    type: z.enum(TRANSACTION_TYPES as [string, ...string[]])
})


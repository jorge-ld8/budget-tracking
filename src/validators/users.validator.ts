import { z } from "zod";
import { CURRENCIES } from "../utils/constants.ts";
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const idSchema = z.object({
    id: z.string().regex(objectIdRegex, { message: "Invalid user ID" })
});

export const createUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    username: z.string().min(1),
    currency: z.enum(CURRENCIES as [string, ...string[]])
});

export const updateUserSchema = z.object({
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    username: z.string().min(1).optional(),
    currency: z.enum(CURRENCIES as [string, ...string[]]).optional()
});





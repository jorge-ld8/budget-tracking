import { z } from "zod";

export const spendingByCategorySchema = z.object({
    startDate: z.string().date(),
    endDate: z.string().date(),
});

export const incomeVsExpensesSchema = z.object({
    startDate: z.string().date(),
    endDate: z.string().date(),
    groupBy: z.enum(['day', 'week', 'month', 'year']),
});

export const monthlyTrendSchema = z.object({
    months: z.string().transform(val => parseInt(val)).pipe(z.number().min(6, { message: 'Month must be between 6 and 12' }).max(12, { message: 'Month must be between 6 and 12' }) ),
})
import { z } from "zod"
import { pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Table will only be populated with values from API responses from banking provider
export const TransactionType = pgTable('transaction_type', {
  id: text().primaryKey()
})

export const transactionTypeInsertSchema = createInsertSchema(TransactionType);
export const transactionTypeSelectSchema = createSelectSchema(TransactionType);

export type TransactionTypeInsertSchema = z.infer<typeof transactionTypeInsertSchema>
export type TransactionTypeSelectSchema = z.infer<typeof transactionTypeSelectSchema>
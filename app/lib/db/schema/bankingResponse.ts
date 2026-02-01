import { z } from "zod"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { pgTable, text, uuid, json } from "drizzle-orm/pg-core"
import { Run } from "./run"
import { BankingRequest } from "./bankingRequest"

// Table will only be populated with data during batch runs or reruns
export const BankingResponse = pgTable('banking_response', {
  id: text().primaryKey(),
  requestId: text().references(() => BankingRequest.id).unique(),
  runId: uuid().notNull().references(() => Run.id),
  status: text(), // HTTP status code from banking provider
  error: text().array(), // Errors should be prefixed to identify banking provider as source of the error
  transactions: json().array(),
})

export const bankingResponseInsertSchema = createInsertSchema(BankingResponse)

// Only done on batch runs to transform and move transactions to separate table
export const bankingResponseSelectSchema = createSelectSchema(BankingResponse).pick({
  transactions: true,
})

export type BankingResponseInsertSchema = z.infer<typeof bankingResponseInsertSchema>
export type BankingResponseSelectSchema = z.infer<typeof bankingResponseSelectSchema>
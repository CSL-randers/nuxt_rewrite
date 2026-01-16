import { z } from "zod"
import { createInsertSchema } from "drizzle-zod"
import { pgTable, text, uuid, json } from "drizzle-orm/pg-core"
import { Run } from "./run"

// Table will only be populated with data during batch runs or reruns
export const BankingRequest = pgTable('banking_request', {
  id: text().primaryKey(),
  runId: uuid().notNull().references(() => Run.id),
  payload: json(),
})

export const bankingRequestInsertSchema = createInsertSchema(BankingRequest)

export type BankingRequestInsertSchema = z.infer<typeof bankingRequestInsertSchema>
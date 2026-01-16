import { z } from "zod"
import { createInsertSchema } from "drizzle-zod"
import { pgTable, text, json, uuid } from "drizzle-orm/pg-core"
import { Run } from "./run"

// Table will only be populated with data during batch runs or reruns
export const ErpRequest = pgTable('erp_request', {
  id: text().primaryKey(),  // VoucherId
  runId: uuid().notNull().references(() => Run.id),
  payload: json(),
})

export const erpRequestInsertSchema = createInsertSchema(ErpRequest)

export type ErpRequestInsertSchema = z.infer<typeof erpRequestInsertSchema>
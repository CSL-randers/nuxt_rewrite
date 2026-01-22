import { z } from "zod"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { pgTable, text, uuid } from "drizzle-orm/pg-core"
import { ErpRequest, Run } from "./index"

// Table will only be populated with data during batch runs or reruns
export const ErpResponse = pgTable('erp_response', {
  id: text().primaryKey(),  // VoucherId
  requestId: text().references(() => ErpRequest.id).unique(),
  runId: uuid().notNull().references(() => Run.id),
  status: text(), // Custom status code from ERP provider
  error: text(), // Errors should be prefixed to identify ERP provider as source of the error, when moved to runs table
  payload: text(),
})

export const erpResponseInsertSchema = createInsertSchema(ErpResponse)

// When erp rejects a payload, admin can rewrite payload and resend
export const erpResponseSelectSchema = createSelectSchema(ErpResponse).pick({
  payload: true,
})

export type ErpResponseInsertSchema = z.infer<typeof erpResponseInsertSchema>
export type ErpResponseSelectSchema = z.infer<typeof erpResponseSelectSchema>
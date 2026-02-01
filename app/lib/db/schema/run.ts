import { z } from "zod"
import { createInsertSchema, createUpdateSchema, createSelectSchema } from "drizzle-zod"
import { pgTable, date, uuid, json } from "drizzle-orm/pg-core"
import { runStatusEnum } from "./enums"

// Table will only be populated with data during batch runs and when user books an open items
export const Run = pgTable('run', {
  id: uuid().defaultRandom().primaryKey(),  
  bookingDate: date().notNull(),
  status: runStatusEnum(),
  errors: json().array(),
  transactions: json().array(),
  docs: json().array(),
  bankingRequests: json(),
  bankingResponses: json(),
  erpRequests: json(),
  erpResponses: json(),
})

// Runs initially created with only bookingDate and id
export const runInsertSchema = createInsertSchema(Run).pick({
  bookingDate: true,
})
// Runs get updated with every exchange of data between banking and ERP providers
export const runUpdateSchema = createUpdateSchema(Run).pick({
  status: true,
  errors: true,
  transactions: true,
  docs: true,
  bankingRequests: true,
  bankingResponses: true,
  erpRequests: true,
  erpResponses: true,
})

export const runSelectSchema = createSelectSchema(Run)

export type RunInsertSchema = z.infer<typeof runInsertSchema>
export type RunUpdateSchema = z.infer<typeof runUpdateSchema>
export type RunSelectSchema = z.infer<typeof runSelectSchema>
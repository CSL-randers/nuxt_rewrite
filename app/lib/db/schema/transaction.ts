import { z } from "zod"
import { pgTable, text, integer } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema, createSelectSchema } from "drizzle-zod"
import { bookingStatusEnum } from "./enums"
import { Account } from "./account"
import { Run } from "./run"
import { Rule } from "./rule"

export const Transaction = pgTable('transaction', {
  id: text().primaryKey(),
  bookingDate: integer().notNull().references(() => Run.bookingDate),
  bankAccount: text().notNull().references(() => Account.id),
  bankAccountName: text().notNull().references(() => Account.name),
  amount: integer().notNull(),
  transactionType: text().notNull(),
  counterpart: text().notNull(),
  references: text().array().notNull(),
  ruleApplied: integer().references(() => Rule.id),
  status: bookingStatusEnum() // "Åben" status routes transactions to open items page
})

export const transactionSelectSchema = createSelectSchema(Transaction)
export const transactionUpdateSchema = createUpdateSchema(Transaction).pick({
  ruleApplied: true,
  status: true,
})
export const transactionInsertSchema = createInsertSchema(Transaction)

export type TransactionSelectSchema = z.infer<typeof transactionSelectSchema>
export type TransactionUpdateSchema = z.infer<typeof transactionUpdateSchema>
export type TransactionInsertSchema = z.infer<typeof transactionInsertSchema>
import { z } from "zod"
import { pgTable, text, integer, numeric, date, uniqueIndex } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema, createSelectSchema } from "drizzle-zod"
import { bookingStatusEnum } from "./enums"
import { Account } from "./account"
import { Rule } from "./rule"

// Table is structured and mostly named after providers API response.entries[i] or 'SimpleAccountReportEntry'
export const Transaction = pgTable('transaction', {
  sequence: integer().notNull(),                                               // API: entries[i].sequence
  bookingDate: date({ mode: "date" }).notNull(),                               // API: entries[i].date.booking

  // Metadata
  status: bookingStatusEnum().notNull().default("åben"),
  ruleApplied: integer().references(() => Rule.id),
  lockedAt: date({ mode: "date" }),
  lockedBy: text(),
  
  // Generic info
  account: text().notNull().references(() => Account.id),
  name: text().notNull(),
  amount: numeric().notNull(),
  type: text(),
  text: text(),

  // References
  primaryReference: text(),
  id: text(),
  batch: text(),
  endToEndId: text(),
  ocrReference: text(),
  debtorsPaymentId: text(),
  debtorText: text(),
  debtorMessage: text(),
  creditorText: text(),
  creditorMessage: text(),

  // Debtor / Creditor info
  debtorId: text(),                           // API: entries[i].debtor.id
  debtorName: text(),                         // API: entries[i].debtor.name
  creditorId: text(),                         // API: entries[i].creditor.id
  creditorName: text(),                       // API: entries[i].creditor.name

  // ISO 20022 transaction codes
  txCodeDomain: text(),                       // API: entries[i].transactionCodes.domain
  txCodeFamily: text(),                       // API: entries[i].transactionCodes.family
  txCodeSubFamily: text(),                    // API: entries[i].transactionCodes.subFamily
},
  (table) => ({
    transactionId: uniqueIndex('transaction_id')
      .on(table.account, table.sequence),
  }))

export const transactionSelectSchema = createSelectSchema(Transaction)
export const transactionUpdateSchema = createUpdateSchema(Transaction).pick({
  ruleApplied: true,
  status: true,
})
export const transactionInsertSchema = createInsertSchema(Transaction)

export type TransactionSelectSchema = z.infer<typeof transactionSelectSchema>
export type TransactionUpdateSchema = z.infer<typeof transactionUpdateSchema>
export type TransactionInsertSchema = z.infer<typeof transactionInsertSchema>
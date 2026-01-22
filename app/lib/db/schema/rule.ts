import { z } from "zod"
import { pgTable, text, date, numeric, integer, uuid } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema, createSelectSchema } from "drizzle-zod"
import { ruleTypeEnum, ruleStatusEnum, cprTypeEnum, Account, RuleTag } from "./index"

export const Rule = pgTable('rule', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  // Metadata
  lastUsed: date({ mode: "date" }),
  createdAt: date({ mode: "date" }),
  updatedAt: date({ mode: "date" }).defaultNow(),
  lockedAt: date({ mode: "date" }),
  lockedBy: text(),
  currentVersionId: uuid().notNull(),

  type: ruleTypeEnum(),
  status: ruleStatusEnum(),

  // Scope
  relatedBankAccounts: text().array().notNull().references(() => Account.id),

  // 🔍 Matching – references
  matchPrimaryReference: text().array(),
  matchProviderId: text().array(),
  matchEndToEndId: text().array(),
  matchOcrReference: text().array(),
  matchBatch: text().array(),
  matchDebtorsPaymentId: text().array(),

  // 🔍 Matching – counterparties & text
  matchDebtorId: text().array(),
  matchDebtorName: text().array(),
  matchCreditorId: text().array(),
  matchCreditorName: text().array(),
  matchDebtorText: text().array(),
  matchCreditorText: text().array(),
  matchText: text().array(),

  // 🔍 Matching – classification
  matchType: text().array(),
  matchTxDomain: text().array(),
  matchTxFamily: text().array(),
  matchTxSubFamily: text().array(),

  // 🔍 Matching – amount
  matchAmountMin: numeric(),
  matchAmountMax: numeric(),

  // 🧾 Accounting
  accountingPrimaryAccount: text().notNull(),
  accountingSecondaryAccount: text(),
  accountingTertiaryAccount: text(),
  accountingText: text(),
  accountingCprType: cprTypeEnum(),
  accountingCprNumber: text(),
  accountingNotifyTo: text(),
  accountingNote: text(),

  // 📎 Attachments
  accountingAttachmentName: text().array(),
  accountingAttachmentFileExtension: text().array(),
  accountingAttachmentData: text().array(),

  // 🏷️ Tags
  ruleTags: integer().array().references(() => RuleTag.id),
})


export const ruleInsertSchema = createInsertSchema(Rule, {
  // Add custom Zod refinements here
  // Limit to own domain
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const ruleUpdateSchema = createUpdateSchema(Rule, {
  // Add custom Zod refinements here
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

// For fetching rules to get accounting info to open items
export const ruleSelectSchema = createSelectSchema(Rule).pick({
  accountingPrimaryAccount: true,
  accountingSecondaryAccount: true,
  accountingTertiaryAccount: true,
  accountingText: true,
  accountingCprType: true,
  accountingCprNumber: true
})

export type RuleInsertSchema = z.infer<typeof ruleInsertSchema>
export type RuleUpdateSchema = z.infer<typeof ruleUpdateSchema>
export type RuleSelectSchema = z.infer<typeof ruleSelectSchema>
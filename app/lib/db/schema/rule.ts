import { z } from "zod"
import { pgTable, text, date, numeric, integer } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema, createSelectSchema } from "drizzle-zod"
import { ruleTypeEnum, ruleStatusEnum, cprTypeEnum } from "./enums"
import { Account } from "./account"
import { RuleTag } from "./ruleTag"
import { TransactionType } from "./transactionType"

export const Rule = pgTable('rule', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  type: ruleTypeEnum(),
  status: ruleStatusEnum(),
  relatedBankAccounts: text().array().notNull().references(() => Account.id),
  lastUsed: date({ mode: "date" }),
  createdAt: date({ mode: "date" }).$default(() => new Date()),
  updatedAt: date({ mode: "date" }).$default(() => new Date()).$onUpdate(() => new Date()),
  matchText: text().array(),
  matchCounterparty: text().array(),
  matchType: text().array().references(() => TransactionType.id),
  matchAmountMin: numeric(),
  matchAmountMax: numeric(),
  accountingPrimaryAccount: text().notNull(), // Artskonto i Opus
  accountingSecondaryAccount: text(), // PSP-element i Opus
  accountingTertiaryAccount: text(), // Omkostningssted i Opus
  accountingText: text(),
  accountingCprType: cprTypeEnum(),
  accountingCprNumber: text(),
  accountingNotifyTo: text(),
  accountingNote: text(),
  accountingAttachmentName: text().array(),
  accountingAttachmentFileExtension: text().array(),
  accountingAttachmentData: text().array(),
  ruleTags: integer().array().references(() => RuleTag.id),   
})

export const ruleInsertSchema = createInsertSchema(Rule, {
  // Add custom Zod refinements here
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
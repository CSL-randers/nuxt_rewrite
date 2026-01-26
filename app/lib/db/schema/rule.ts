import { z } from "zod"
import { pgTable, text, date, numeric, integer, uuid } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema, createSelectSchema } from "drizzle-zod"
import { ruleTypeEnum, ruleStatusEnum, cprTypeEnum, Account, RuleTag } from "./index"
import { ruleListDto } from "../dto/ruleList"

// ---------------------------
// 1. Typedefs and matchEntry
// ---------------------------
export const matchCategories = Object.keys(ruleListDto.shape.matching.shape) as string[]

export const matchEntrySchema = z.object({
  category: z.enum(matchCategories),
  value: z.string().min(1, "Value kan ikke være tom"),
  fields: z.array(z.string()).min(1, "Vælg mindst én kolonne"), // DB kolonner som fx matchText
  gate: z.enum(['AND', 'OR']).default('AND')
})
export type MatchEntry = z.infer<typeof matchEntrySchema>

// Frontend matchStep schema
export const matchStepInsertSchema = z.object({
  matches: z.array(matchEntrySchema).min(1, "Vælg mindst én match entry"),
})
export type MatchStepInsertSchema = z.infer<typeof matchStepInsertSchema>

// ---------------------------
// 2. Main table
// ---------------------------
export const Rule = pgTable('rule', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  // Metadata
  lastUsed: date({ mode: "date" }),
  createdAt: date({ mode: "date" }).defaultNow(),
  updatedAt: date({ mode: "date" }).$onUpdate(() => new Date()),
  lockedAt: date({ mode: "date" }),
  lockedBy: text(),
  currentVersionId: uuid().notNull(),

  type: ruleTypeEnum(),
  status: ruleStatusEnum(),

  relatedBankAccounts: text().array().notNull().references(() => Account.id),

  // 🔍 Matching – references
  matchText: text().array(),
  matchPrimaryReference: text().array(),
  matchId: text().array(),
  matchBatch: text().array(),
  matchEndToEndId: text().array(),
  matchOcrReference: text().array(),
  matchDebtorsPaymentId: text().array(),
  matchDebtorText: text().array(),
  matchDebtorMessage: text().array(),
  matchCreditorText: text().array(),
  matchCreditorMessage: text().array(),

  // 🔍 Matching – counterparties
  matchDebtorId: text().array(),
  matchDebtorName: text().array(),
  matchCreditorId: text().array(),
  matchCreditorName: text().array(),

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
  ruleTags: text().array().references(() => RuleTag.id),
})

// ---------------------------
// 3. Helpers
// ---------------------------
export function mapMatchesToDbArrays(matches: MatchEntry[]) {
  const dbObj: Partial<Record<string, string[]>> = {}

  matches.forEach(entry => {
    entry.fields.forEach(field => {
      if (!dbObj[field]) dbObj[field] = []
      dbObj[field]!.push(entry.value)
    })
  })

  return dbObj
}

// ---------------------------
// 4. Insert / Update / Select schemas
// ---------------------------
export const ruleInsertSchema = createInsertSchema(Rule).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const basicStepInsertSchema  = createInsertSchema(Rule).pick({
  type: true,
  status: true,
  relatedBankAccounts: true
})

export const accountingStepInsertSchema  = createInsertSchema(Rule).omit({
  accountingPrimaryAccount: true,
  accountingSecondaryAccount: true,
  accountingTertiaryAccount: true,
  accountingText: true,
  accountingCprType: true,
  accountingCprNumber: true,
  accountingNotifyTo: true,
  accountingNote: true,
  accountingAttachmentName: true,
  accountingAttachmentFileExtension: true,
  accountingAttachmentData: true
})

export const ruleUpdateSchema = createUpdateSchema(Rule).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const ruleSelectSchema = createSelectSchema(Rule)
export const ruleMatchingSelectSchema = createSelectSchema(Rule).pick({
  accountingPrimaryAccount: true,
  accountingSecondaryAccount: true,
  accountingTertiaryAccount: true,
  accountingText: true,
  accountingCprType: true,
  accountingCprNumber: true
})

// ---------------------------
// 5. Type exports
// ---------------------------
export type RuleInsertSchema = z.infer<typeof ruleInsertSchema>
export type RuleUpdateSchema = z.infer<typeof ruleUpdateSchema>
export type RuleSelectSchema = z.infer<typeof ruleSelectSchema>
export type RuleMatchingSelectSchema = z.infer<typeof ruleMatchingSelectSchema>
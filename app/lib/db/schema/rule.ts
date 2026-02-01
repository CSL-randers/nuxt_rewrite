import { z } from "zod"
import { pgTable, text, date, numeric, integer, uuid } from "drizzle-orm/pg-core"
import { createUpdateSchema, createSelectSchema } from "drizzle-zod"
import type { RuleType, RuleStatus } from "./enums"
import { ruleTypeEnum, ruleStatusEnum, cprTypeEnum, ruleTypeValues, ruleStatusValues, cprTypeValues } from "./enums"
import { Account } from "./account"
import { RuleTag } from "./ruleTag"


type RuleColumnKey =
  | 'matchText'
  | 'matchPrimaryReference'
  | 'matchId'
  | 'matchBatch'
  | 'matchEndToEndId'
  | 'matchOcrReference'
  | 'matchDebtorsPaymentId'
  | 'matchDebtorText'
  | 'matchDebtorMessage'
  | 'matchCreditorText'
  | 'matchCreditorMessage'
  | 'matchDebtorId'
  | 'matchDebtorName'
  | 'matchCreditorId'
  | 'matchCreditorName'
  | 'matchType'
  | 'matchTxDomain'
  | 'matchTxFamily'
  | 'matchTxSubFamily'

// ---------------------------
// 1. Main table
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
// 2. Typedefs and matchEntry
// ---------------------------

export const matchCategoryColumns = {
  Fritekst: [
    'matchText',
    'matchPrimaryReference',
    'matchId',
    'matchBatch',
    'matchEndToEndId',
    'matchOcrReference',
    'matchDebtorsPaymentId',
    'matchDebtorText',
    'matchDebtorMessage',
    'matchCreditorText',
    'matchCreditorMessage'
  ],
  Part: [
    'matchDebtorId',
    'matchDebtorName',
    'matchCreditorId',
    'matchCreditorName'
  ],
  Transaktionstype: [
    'matchType',
    'matchTxDomain',
    'matchTxFamily',
    'matchTxSubFamily'
  ]
} satisfies Record<string, RuleColumnKey[]>

export type MatchCategory = keyof typeof matchCategoryColumns

export const matchCategories = Object.keys(matchCategoryColumns) as MatchCategory[]

export type MatchField = keyof typeof Rule

export const matchEntrySchema = z.object({
  category: z.enum(matchCategories),
  value: z.string().min(1, "Value kan ikke være tom"),
  fields: z.array(z.custom<MatchField>()).optional(),
  gate: z.enum(['OG', 'ELLER']).default('OG')
})

export type MatchGate = 'OG' | 'ELLER'
export type MatchEntry = z.infer<typeof matchEntrySchema>


// ---------------------------
// 3. Helpers
// ---------------------------
export function mapMatchesToDbArrays(matches: MatchEntry[]) {
  const dbObj: Partial<Record<keyof typeof Rule, string[]>> = {}

  matches.forEach(entry => {
    const fields =
      entry.fields?.length
        ? entry.fields
        : matchCategoryColumns[entry.category]

    fields.forEach(field => {
      if (!dbObj[field]) dbObj[field] = []
      dbObj[field]!.push(entry.value)
    })
  })

  return dbObj
}

// ---------------------------
// 4. Insert / Update / Select schemas
// ---------------------------
export const ruleDraftSchema = z.object({
  type: z.enum(ruleTypeValues),
  status: z.enum(ruleStatusValues),
  relatedBankAccounts: z.array(z.string()).min(1, "Vælg mindst én bankkonto"),
  matches: z.array(matchEntrySchema).min(1, "Tilføj mindst ét match"),
  accountingPrimaryAccount: z.string().min(1, "Primær konto er påkrævet"),
  accountingSecondaryAccount: z.string().optional(),
  accountingTertiaryAccount: z.string().optional(),
  accountingText: z.string().optional(),
  accountingCprType: z.enum(cprTypeValues),
  accountingCprNumber: z.string().optional(),
  accountingNotifyTo: z.string().email("Ugyldigt email").optional().or(z.literal("")),
  accountingNote: z.string().optional(),
  accountingAttachmentName: z.array(z.string()).optional(),
  accountingAttachmentFileExtension: z.array(z.string()).optional(),
  accountingAttachmentData: z.array(z.string()).optional(),
  ruleTags: z.array(z.string()).optional(),
})

export const ruleSelectSchema = createSelectSchema(Rule)

export const ruleUpdateSchema = createUpdateSchema(Rule).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const ruleMatchingSelectSchema = createSelectSchema(Rule).pick({
  accountingPrimaryAccount: true,
  accountingSecondaryAccount: true,
  accountingTertiaryAccount: true,
  accountingText: true,
  accountingCprType: true,
  accountingCprNumber: true
})

// ---------------
// 5. Type exports
// ---------------
export type RuleDraftSchema = z.infer<typeof ruleDraftSchema>
export type RuleUpdateSchema = z.infer<typeof ruleUpdateSchema>
export type RuleSelectSchema = z.infer<typeof ruleUpdateSchema>
export type RuleMatchingSelectSchema = z.infer<typeof ruleMatchingSelectSchema>

export type RuleTableRow = {
  id: number
  type: RuleType
  status: RuleStatus
  relatedBankAccounts: string[]
  ruleTags?: string[]
  matching: {
    references: string[]
    counterparties: string[]
    classification: string[]
  }
  createdAt: Date
  updatedAt: Date
  lastUsed?: Date | null
}

export const ruleListDto = z.object({
  id: z.number(),
  type: z.enum(ruleTypeValues),
  status: z.enum(ruleStatusValues),

  relatedBankAccounts: z.array(z.string()),

  lastUsed: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),

  matching: z.object({
    references: z.array(z.string()),
    counterparties: z.array(z.string()),
    classification: z.array(z.string())
  }),

  ruleTags: z.array(z.string()).optional()
}) satisfies z.ZodType<RuleTableRow>

export const ruleListDtoArray = z.array(ruleListDto)
export type RuleListDto = z.infer<typeof ruleListDto>

function mergeArrays(...arrays: (string[] | null | undefined)[]) {
  return arrays.flatMap(a => a ?? []).filter(Boolean)
}

// ------
// 6. DTO
// ------

export function mapRuleToListDto(r: any): RuleListDto {
  return {
    id: r.id,
    type: r.type,
    status: r.status,
    relatedBankAccounts: r.relatedBankAccounts,
    lastUsed: r.lastUsed,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,

    matching: {
      references: mergeArrays(
        r.matchText,
        r.matchPrimaryReference,
        r.matchId,
        r.matchBatch,
        r.matchEndToEndId,
        r.matchOcrReference,
        r.matchDebtorsPaymentId,
        r.matchDebtorText,
        r.matchDebtorMessage,
        r.matchCreditorText,
        r.matchCreditorMessage
      ),

      counterparties: mergeArrays(
        r.matchDebtorId,
        r.matchDebtorName,
        r.matchCreditorId,
        r.matchCreditorName
      ),

      classification: mergeArrays(
        r.matchType,
        r.matchTxDomain,
        r.matchTxFamily,
        r.matchTxSubFamily
      )
    },

    ruleTags: (r.ruleTags as { id: string }[] | undefined)?.map(t => t.id)
  }
}
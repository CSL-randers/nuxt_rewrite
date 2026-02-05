import { z } from "zod"
import { pgTable, text, date, numeric, integer, uuid, primaryKey, bigint } from "drizzle-orm/pg-core"
import { createUpdateSchema, createSelectSchema } from "drizzle-zod"
import type { RuleType, RuleStatus, CprType } from "./enums"
import { ruleTypeEnum, ruleStatusEnum, cprTypeEnum, ruleTypeValues, ruleStatusValues, cprTypeValues } from "./enums"
import { account } from "./account"
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
// 1. Main tables
// ---------------------------
export const rule = pgTable('rule', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  // Metadata
  lastUsed: date({ mode: "date" }),
  createdAt: date({ mode: "date" }).defaultNow(),
  updatedAt: date({ mode: "date" }).$onUpdate(() => new Date()),
  lockedAt: date({ mode: "date" }),
  lockedBy: text(),
  currentVersionId: bigint({ mode: 'number' }).notNull(),

  type: ruleTypeEnum(),
  status: ruleStatusEnum(),

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
})

export const ruleBankAccount = pgTable('rule_bank_account', {
  ruleId: integer().notNull().references(() => rule.id, { onDelete: 'cascade' }),
  bankAccountId: text().notNull().references(() => account.id, { onDelete: 'cascade' }),
}, (table) => ([
  primaryKey({ columns: [table.ruleId, table.bankAccountId] })
]))

export const ruleRuleTag = pgTable('rule_rule_tag', {
  ruleId: integer().notNull().references(() => rule.id, { onDelete: 'cascade' }),
  ruleTagId: text().notNull().references(() => RuleTag.id, { onDelete: 'cascade' }),
}, (table) => ([
  primaryKey({ columns: [table.ruleId, table.ruleTagId] })
]))

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
  ],
} satisfies Record<string, RuleColumnKey[]>

export type MatchCategory = keyof typeof matchCategoryColumns

export const matchCategories = Object.keys(matchCategoryColumns) as MatchCategory[]

export type MatchField = typeof matchCategoryColumns[keyof typeof matchCategoryColumns][number]

export const matchEntrySchema = z.object({
  category: z.enum(matchCategories),
  value: z.string().min(1, "Value kan ikke være tom"),
  fields: z.array(z.custom<MatchField>()).optional(),
  gate: z.enum(['OG', 'ELLER']).default('ELLER')
})

export type MatchGate = 'OG' | 'ELLER'
export type MatchEntry = z.infer<typeof matchEntrySchema>


// ---------------------------
// 3. Helpers
// ---------------------------
export function mapMatchesToDbArrays(matches: MatchEntry[]) {
  const dbObj: Partial<Record<keyof typeof rule, string[]>> = {}

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

export function mapDbArraysToMatches(
  rule: Partial<Record<RuleColumnKey, string[] | null | undefined>>
): MatchEntry[] {
  const result: MatchEntry[] = []

  for (const category of matchCategories) {
    const fields = matchCategoryColumns[category]

    // value -> set of fields where it appears
    const valueFieldMap = new Map<string, Set<RuleColumnKey>>()

    for (const field of fields) {
      const values = rule[field] ?? []

      for (const value of values) {
        if (!valueFieldMap.has(value)) {
          valueFieldMap.set(value, new Set())
        }
        valueFieldMap.get(value)!.add(field)
      }
    }

    for (const [value, fieldSet] of valueFieldMap.entries()) {
      const usedFields = [...fieldSet]

      result.push({
        category,
        value,
        fields:
          usedFields.length === fields.length
            ? undefined
            : usedFields,
        gate: 'ELLER' // evt. senere fra DB
      })
    }
  }

  return result
}

// -----------------------------------
// 4. Insert / Update / Select schemas
// -----------------------------------
export const ruleDraftSchema = z.object({
  type: z.enum(ruleTypeValues),
  status: z.enum(ruleStatusValues),
  lockedAt: z.date().optional(),
  relatedBankAccounts: z.array(z.string()).min(1, "Vælg mindst én bankkonto"),
  matches: z.array(matchEntrySchema).optional(),
  matchAmountMin: z.number().optional(),
  matchAmountMax: z.number().optional(),
  accountingPrimaryAccount: z.string().min(1, "Primær konto er påkrævet"),
  accountingSecondaryAccount: z.string().optional(),
  accountingTertiaryAccount: z.string().optional(),
  accountingText: z.string().optional(),
  accountingCprType: z.enum(cprTypeValues),
  accountingCprNumber: z.string().optional(),
  accountingNotifyTo: z.string().email("Ugyldig email").optional().or(z.literal("")),
  accountingNote: z.string().optional(),
  accountingAttachmentName: z.array(z.string()).optional(),
  accountingAttachmentFileExtension: z.array(z.string()).optional(),
  accountingAttachmentData: z.array(z.string()).optional(),
  ruleTags: z.array(z.string()).optional(),
})

export const ruleBasicSchema = z.object({
  type: z.enum(ruleTypeValues),
  status: z.enum(ruleStatusValues),
  relatedBankAccounts: z.array(z.string()).min(1, "Vælg mindst én bankkonto"),
  ruleTags: z.array(z.string()).optional(),
})

export const ruleMatchingSchema = z.object({
  matches: z.array(matchEntrySchema).optional(),
  matchAmountMin: z.number().optional(),
  matchAmountMax: z.number().optional(),
}).refine(
  data =>
    data.matchAmountMin == null ||
    data.matchAmountMax == null ||
    data.matchAmountMin <= data.matchAmountMax,
  {
    message: 'Minimumsbeløb må ikke være større end maksimumsbeløb',
    path: ['matchAmountMax']
  }
)

export const ruleAccountingSchema = z.object({
  accountingPrimaryAccount: z.string().min(1, "Primær konto er påkrævet"),
  accountingSecondaryAccount: z.string().optional(),
  accountingTertiaryAccount: z.string().optional(),
  accountingText: z.string().optional(),
  accountingCprType: z.enum(cprTypeValues),
  accountingCprNumber: z.string().optional(),
  accountingNotifyTo: z.string().email("Ugyldig email").optional().or(z.literal("")),
  accountingNote: z.string().optional(),
  accountingAttachmentName: z.array(z.string()).optional(),
  accountingAttachmentFileExtension: z.array(z.string()).optional(),
  accountingAttachmentData: z.array(z.string()).optional(),
})

export const ruleSelectSchema = createSelectSchema(rule)

export const ruleUpdateSchema = createUpdateSchema(rule).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const ruleMatchingSelectSchema = createSelectSchema(rule).pick({
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

export type Rule = {
  id: number
  type: RuleType
  status: RuleStatus
  relatedBankAccounts: string[]
  ruleTags?: string[]
  matchText?: string[]
  matchPrimaryReference?: string[]
  matchId?: string[]
  matchBatch?: string[]
  matchEndToEndId?: string[]
  matchOcrReference?: string[]
  matchDebtorsPaymentId?: string[]
  matchDebtorText?: string[]
  matchDebtorMessage?: string[]
  matchCreditorText?: string[]
  matchCreditorMessage?: string[]
  matchDebtorId?: string[]
  matchDebtorName?: string[]
  matchCreditorId?: string[]
  matchCreditorName?: string[]
  matchType?: string[]
  matchTxDomain?: string[]
  matchTxFamily?: string[]
  matchTxSubFamily?: string[]
  matchAmountMin?: number
  matchAmountMax?: number
  accountingPrimaryAccount: string
  accountingSecondaryAccount?: string
  accountingTertiaryAccount?: string
  accountingText?: string
  accountingCprType: CprType
  accountingCprNumber?: string
  accountingNotifyTo?: string
  accountingNote?: string
  accountingAttachmentName?: string[]
  accountingAttachmentFileExtension?: string[]
  accountingAttachmentData?: string[]
  lastUsed?: Date
  createdAt: Date
  updatedAt: Date
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
})

export const ruleListDtoArray = z.array(ruleListDto)
export type RuleListDto = z.infer<typeof ruleListDto>

function mergeArrays(...arrays: (string[] | null | undefined)[]) {
  return arrays.flatMap(a => a ?? []).filter(Boolean)
}

function extractRelatedBankAccountIds(row: any): string[] {
  if (Array.isArray(row.relatedBankAccounts)) {
    return row.relatedBankAccounts.filter((id: any): id is string => typeof id === 'string' && id.length > 0)
  }

  if (Array.isArray(row.bankAccounts)) {
    return row.bankAccounts
      .map((entry: any) => entry?.bankAccountId)
      .filter((id: any): id is string => typeof id === 'string' && id.length > 0)
  }

  return []
}

function extractRuleTagIds(row: any): string[] {
  if (Array.isArray(row.ruleTags)) {
    return row.ruleTags
      .map((tag: any) => {
        if (typeof tag === 'string') return tag
        if (tag?.id) return tag.id
        if (tag?.ruleTagId) return tag.ruleTagId
        return undefined
      })
      .filter((id: any): id is string => typeof id === 'string' && id.length > 0)
  }

  if (Array.isArray(row.tags)) {
    return row.tags
      .map((entry: any) => entry?.tag?.id ?? entry?.ruleTagId)
      .filter((id: any): id is string => typeof id === 'string' && id.length > 0)
  }

  return []
}

// ------
// 6. DTO
// ------

export function mapRuleToListDto(r: any): RuleListDto {
  const relatedBankAccounts = extractRelatedBankAccountIds(r)
  const ruleTags = extractRuleTagIds(r)

  return {
    id: r.id,
    type: r.type,
    status: r.status,
    relatedBankAccounts,
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

    ruleTags: ruleTags.length ? ruleTags : undefined
  }
}
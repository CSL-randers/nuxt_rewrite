import { defineEventHandler, readBody } from 'h3'
import { createInsertSchema } from 'drizzle-zod'
import { Rule, mapMatchesToDbArrays, ruleDraftSchema } from '~/lib/db/schema/index'
import type { RuleDraftSchema } from '~/lib/db/schema/index'
import db from '~/lib/db'

export function compileRuleDraftToDb(draft: RuleDraftSchema) {
  const matchColumns = mapMatchesToDbArrays(draft.matches)

  return {
    type: draft.type,
    status: draft.status,
    relatedBankAccounts: draft.relatedBankAccounts,

    ...matchColumns,

    accountingPrimaryAccount: draft.accountingPrimaryAccount,
    accountingSecondaryAccount: draft.accountingSecondaryAccount,
    accountingTertiaryAccount: draft.accountingTertiaryAccount,
    accountingText: draft.accountingText,
    accountingCprType: draft.accountingCprType,
    accountingCprNumber: draft.accountingCprNumber,
    accountingNotifyTo: draft.accountingNotifyTo,
    accountingNote: draft.accountingNote,
  }
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const draft = ruleDraftSchema.parse(body)
    const dbPayload = compileRuleDraftToDb(draft)
    const validated = createInsertSchema(Rule).parse(dbPayload)

    await db.insert(Rule).values(validated)

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error?.issues ?? error?.message ?? 'Uventet fejl'
    }
  }
})
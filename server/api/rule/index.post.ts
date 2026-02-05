import { defineEventHandler, readBody, createError } from 'h3'
import { createInsertSchema } from 'drizzle-zod'
import { rule, ruleBankAccount, ruleRuleTag, mapMatchesToDbArrays, ruleDraftSchema, ruleVersion, RuleVersionInsertSchema } from '~/lib/db/schema/index'
import type { RuleDraftSchema } from '~/lib/db/schema'
import db from '~/lib/db'

const version = 1

export function compileRuleDraftToDb(draft: RuleDraftSchema) {
  // Konverter matches til DB-kolonner
  const matchColumns = mapMatchesToDbArrays(draft.matches ?? [])

  // Opret payload ved at sprede alt fra draft, men fjerne matches
  const { matches, relatedBankAccounts, ruleTags, ...rest } = draft
  const bankAccountIds = Array.from(new Set(relatedBankAccounts))
  const tagIds = Array.from(new Set(ruleTags ?? []))
  const ruleData = {
    ...rest,
    ...matchColumns,
    currentVersionId: version
  }

  return {
    ruleData,
    bankAccountIds,
    tagIds,
    versionContent: {
      ...ruleData,
      relatedBankAccounts: bankAccountIds,
      ruleTags: tagIds
    }
  }
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    console.log('[rule.post] incoming body', body)
    const draft = ruleDraftSchema.parse(body)
    console.log('[rule.post] parsed draft', draft)
    const { ruleData, bankAccountIds, tagIds, versionContent } = compileRuleDraftToDb(draft)
    console.log('[rule.post] compiled payload', { ruleData, bankAccountIds, tagIds })

    // -----------------------
    // Indsæt ny regel i rule tabellen
    // -----------------------
    const validatedRule = createInsertSchema(rule).parse(ruleData)
    const insertedRule = await db.insert(rule).values(validatedRule).returning()
    console.log('[rule.post] inserted rule row', insertedRule)

    if (!insertedRule[0]) {
      throw createError({ statusCode: 500, statusMessage: 'Fejl ved oprettelse af regel' })
    }

    const ruleId = insertedRule[0].id

    // -----------------------
    // Tilknyt bankkonti og tags
    // -----------------------
    if (bankAccountIds.length) {
      await db.insert(ruleBankAccount).values(
        bankAccountIds.map(bankAccountId => ({ ruleId, bankAccountId }))
      )
      console.log('[rule.post] linked bank accounts', bankAccountIds)
    }

    if (tagIds.length) {
      await db.insert(ruleRuleTag).values(
        tagIds.map(ruleTagId => ({ ruleId, ruleTagId }))
      )
      console.log('[rule.post] linked tags', tagIds)
    }

    // -----------------------
    // Opret rule_version
    // -----------------------
    const versionPayload: RuleVersionInsertSchema = {
      ruleId,
      version,
      content: versionContent
    }

    await db.insert(ruleVersion).values(versionPayload)
    console.log('[rule.post] inserted rule version', versionPayload)

    const storage = useStorage('rules')
    await storage.removeItem('rule-list')
    console.log('[rule.post] cache invalidated for rule-list')

    return { success: true, ruleId }
  } catch (error: any) {
    console.error('[rule.post] error', error)
    return {
      success: false,
      error: error?.issues ?? error?.message ?? 'Uventet fejl'
    }
  }
})

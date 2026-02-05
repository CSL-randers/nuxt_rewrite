import { defineEventHandler, readBody, createError } from 'h3'
import { createInsertSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import db from '~/lib/db'
import type { RuleDraftSchema } from '~/lib/db/schema'
import {
  rule,
  ruleBankAccount,
  ruleRuleTag,
  ruleVersion,
  ruleDraftSchema,
  RuleVersionInsertSchema,
  mapMatchesToDbArrays
} from '~/lib/db/schema/index'

function compileRuleDraftToDb(draft: RuleDraftSchema, newVersion: bigint) {
  const matchColumns = mapMatchesToDbArrays(draft.matches ?? [])
  const { matches, relatedBankAccounts, ruleTags, ...rest } = draft
  const bankAccountIds = Array.from(new Set(relatedBankAccounts))
  const tagIds = Array.from(new Set(ruleTags ?? []))
  const ruleData = {
    ...rest,
    ...matchColumns,
    currentVersionId: newVersion
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
  const id = Number(event.context.params?.id)
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing rule id' })

  const body = await readBody(event)
  const parsed = ruleDraftSchema.safeParse(body)
  if (!parsed.success) return { success: false, error: parsed.error }

  // -------------------
  // Hent eksisterende regel
  // -------------------
  const existingRule = await db.query.rule.findFirst({
    where: (fields, { eq }) => eq(fields.id, id)
  })
  if (!existingRule) throw createError({ statusCode: 404, statusMessage: 'Rule not found' })

  // -------------------
  // Tjek locking (5 min)
  // -------------------
  const now = new Date()
  if (existingRule.lockedAt && (new Date(existingRule.lockedAt).getTime() + 5 * 60 * 1000) > now.getTime()) {
    return { success: false, error: 'Reglen er låst af en anden bruger' }
  }

  const newVersion = (existingRule.currentVersionId ?? 0n) + 1n

  const { ruleData, bankAccountIds, tagIds, versionContent } = compileRuleDraftToDb(parsed.data, BigInt(newVersion))
  const validatedDbPayload = createInsertSchema(rule).parse(ruleData)

  // -------------------
  // Opdater rule
  // -------------------
  const [updatedRule] = await db.update(rule)
    .set(validatedDbPayload)
    .where((fields, { eq }) => eq(fields.id, id))
    .returning()

  if (!updatedRule) throw createError({ statusCode: 500, statusMessage: 'Fejl ved opdatering af regel' })

  // -------------------
  // Opdater relationstabeller
  // -------------------
  await db.delete(ruleBankAccount).where(eq(ruleBankAccount.ruleId, id))
  if (bankAccountIds.length) {
    await db.insert(ruleBankAccount).values(
      bankAccountIds.map(bankAccountId => ({ ruleId: id, bankAccountId }))
    )
  }

  await db.delete(ruleRuleTag).where(eq(ruleRuleTag.ruleId, id))
  if (tagIds.length) {
    await db.insert(ruleRuleTag).values(
      tagIds.map(ruleTagId => ({ ruleId: id, ruleTagId }))
    )
  }

  // -------------------
  // Indsæt rule_version
  // -------------------
  const versionPayload: RuleVersionInsertSchema = {
    ruleId: id,
    version: Number(newVersion), // version-tabellen bruger Number
    content: versionContent
  }

  await db.insert(ruleVersion).values(versionPayload)

  const storage = useStorage('rules')
  await storage.removeItem('rule-list')

  return { success: true, ruleId: id, version: Number(newVersion) }
})

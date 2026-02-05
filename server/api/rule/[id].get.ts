import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { mapDbArraysToMatches, ruleDraftSchema, rule } from '~/lib/db/schema'
import db from '~/lib/db'

function normalizeDbRow(row: any) {
  const normalized: any = { ...row }
  for (const key in row) {
    if (Array.isArray(row[key])) continue
    if (row[key] === null) normalized[key] = undefined
  }
  return normalized
}

export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'Missing rule id' })
    }

    // --------------------------
    // Hent regel fra DB
    // --------------------------
    const dbRule = await db.query.Rule.findFirst({
      where: (fields, { eq }) => eq(fields.id, Number(id)),
      with: {
        bankAccounts: {
          columns: {
            bankAccountId: true
          }
        },
        tags: {
          columns: {
            ruleTagId: true
          }
        }
      }
    })

    if (!dbRule) {
      throw createError({ statusCode: 404, statusMessage: 'Rule not found' })
    }

    // --------------------------
    // Håndter locking
    // --------------------------
    const now = new Date()

    // Hvis reglen allerede er låst, returnér lockedAt
    let isLocked = false
    if (dbRule.lockedAt && (new Date(dbRule.lockedAt).getTime() + 5 * 60 * 1000) > now.getTime()) {
      // Låsning gælder i f.eks. 5 minutter
      isLocked = true
    } else {
      // Sæt lockedAt = nu, så andre brugere ser reglen som låst
      await db.update(rule)
        .set({ lockedAt: now })
        .where(eq(rule.id, Number(id)))
    }

    // --------------------------
    // Byg draft objekt
    // --------------------------
    const normalizedRule = normalizeDbRow(dbRule)
    const relatedBankAccounts = dbRule.bankAccounts?.map(acc => acc.bankAccountId).filter(Boolean) ?? []
    const ruleTags = dbRule.tags?.map(tag => tag.ruleTagId).filter(Boolean) ?? []

    delete (normalizedRule as any).bankAccounts
    delete (normalizedRule as any).tags

    const matches = mapDbArraysToMatches(normalizedRule)
    const draft = ruleDraftSchema.parse({
      ...normalizedRule,
      relatedBankAccounts,
      ruleTags,
      matches,
      lockedAt: isLocked ? dbRule.lockedAt : null
    })

    // --------------------------
    // Valider med zod
    // --------------------------
    const validated = ruleDraftSchema.parse(draft)

    return validated
  } catch (error: any) {
    return {
      success: false,
      error: error?.issues ?? error?.message ?? 'Uventet fejl'
    }
  }
})

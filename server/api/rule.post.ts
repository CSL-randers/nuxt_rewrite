import { defineEventHandler, readBody } from 'h3'
import { Rule, ruleInsertSchema, mapMatchesToDbArrays, matchStepInsertSchema, MatchStepInsertSchema } from '~/lib/db/schema/index'
import db from '~/lib/db'

// Intern helper, som du allerede har
async function createRule(input: {
  basicStep: any,
  matchStep: MatchStepInsertSchema,
  accountingStep: any
}) {
  // Valider frontend input
  const validatedMatch = matchStepInsertSchema.parse(input.matchStep)

  // Mapper match entries → DB kolonner
  const matchColumns = mapMatchesToDbArrays(validatedMatch.matches)

  // Sammensæt payload til DB insert
  const payload = {
    ...input.basicStep,
    ...matchColumns,
    ...input.accountingStep
  }

  const dbValidated = ruleInsertSchema.parse(payload)

  await db.insert(Rule).values(dbValidated)

  return dbValidated
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  try {
    const createdRule = await createRule(body)
    return {
      success: true,
      data: createdRule
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Uventet fejl'
    }
  }
})

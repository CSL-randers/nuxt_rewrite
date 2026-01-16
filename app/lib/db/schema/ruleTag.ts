import { z } from "zod"
import { createInsertSchema, createUpdateSchema, createSelectSchema } from "drizzle-zod"
import { pgTable, text } from "drizzle-orm/pg-core"

export const RuleTag = pgTable('rule_tag', {
  id: text().primaryKey()
})

export const ruleTagInsertSchema = createInsertSchema(RuleTag)
export const ruleTagUpdateSchema = createUpdateSchema(RuleTag)
// For fetching ruletags when creating or updating rules
export const ruleTagSelectSchema = createSelectSchema(RuleTag)

export type RuleTagInsertSchema = z.infer<typeof ruleTagInsertSchema>
export type RuleTagUpdateSchema = z.infer<typeof ruleTagUpdateSchema>
export type RuleTagSelectSchema = z.infer<typeof ruleTagSelectSchema>
import { z } from 'zod'

export const ruleListDto = z.object({
  id: z.number(),
  type: z.string(),
  status: z.string(),

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

import { ruleListDtoArray, mapRuleToListDto } from '~/lib/db/schema'
import db from '~/lib/db'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, max-age=60')

  const storage = useStorage('rules')
  const cached = await storage.getItem('rule-list')

  if (cached) {
    return ruleListDtoArray.parse(cached)
  }

  const rows = await db.query.Rule.findMany({
    columns: {
      id: true,
      type: true,
      status: true,
      relatedBankAccounts: true,
      lastUsed: true,
      createdAt: true,
      updatedAt: true,

      matchText: true,
      matchPrimaryReference: true,
      matchId: true,
      matchBatch: true,
      matchEndToEndId: true,
      matchOcrReference: true,
      matchDebtorsPaymentId: true,
      matchDebtorText: true,
      matchDebtorMessage: true,
      matchCreditorText: true,
      matchCreditorMessage: true,

      matchDebtorId: true,
      matchDebtorName: true,
      matchCreditorId: true,
      matchCreditorName: true,

      matchType: true,
      matchTxDomain: true,
      matchTxFamily: true,
      matchTxSubFamily: true
    },
    with: {
      ruleTags: {
        columns: {
          id: true
        }
      }
    },
    orderBy: (rule, { desc }) => [desc(rule.updatedAt)]
  })

  const dto = rows.map(mapRuleToListDto)
  const parsed = ruleListDtoArray.parse(dto)

  await storage.setItem('rule-list', parsed, { ttl: 60 })

  return parsed
})

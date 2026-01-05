import { z } from 'zod'
import RuleStatus from '~/types'
import RuleType from '~/types'
import CprType from '~/types'

export const ruleFormSchema = z.object({
  type: z.enum(RuleType),
  status: z.enum(RuleStatus),

  bankAccountName: z.string().min(1),

  matchText: z.array(z.string()).nullable(),
  matchCounterparty: z.array(z.string()).nullable(),
  matchType: z.string(),

  matchAmountMin: z.number().nullable(),
  matchAmountMax: z.number().nullable(),

  accountingPrimaryAccount: z.string().nullable(),
  accountingSecondaryAccount: z.string().nullable(),
  accountingTertiaryAccount: z.string().nullable(),

  accountingText: z.string().nullable(),

  accountingCprType: z.enum(CprType),
  accountingCprNumber: z.string().nullable(),

  accountingNotifyTo: z.email().nullable(), // må kun være i domænet randers.dk
  accountingNote: z.string().nullable(),

  ruleTags: z.array(z.string()).nullable()
})

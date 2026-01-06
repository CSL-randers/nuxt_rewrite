import { z } from 'zod'
import { RuleStatusValues, RuleTypeValues, CprTypeValues } from '~/types'

// Her antager vi, at RuleStatus, RuleType, CprType er string unions
export const ruleFormSchema = z.object({
  type: z.enum(RuleTypeValues),           // f.eks. ['standard','undtagelse','engangs']
  status: z.enum(RuleStatusValues),       // f.eks. ['aktiv','inaktiv']
  relatedBankAccounts: z.array(z.string()).min(1), // skal matche state.relatedBankAccounts

  matchText: z.array(z.string()).nullable(),
  matchCounterparty: z.array(z.string()).nullable(),
  matchType: z.string().nullable(), // tillad null så det kan cleares

  matchAmountMin: z.number().nullable(),
  matchAmountMax: z.number().nullable(),

  accountingPrimaryAccount: z.string().nullable(),
  accountingSecondaryAccount: z.string().nullable(),
  accountingTertiaryAccount: z.string().nullable(),

  accountingText: z.string().nullable(),

  accountingCprType: z.enum(CprTypeValues),
  accountingCprNumber: z.string().nullable(),

  accountingNotifyTo: z
    .string()
    .email()
    .nullable()
    .refine(val => !val || val.endsWith('@randers.dk'), { message: 'Email skal være @randers.dk' }),
    
  accountingNote: z.string().nullable(),

  ruleTags: z.array(z.string()).nullable()
})

export type RuleFormSchema = z.infer<typeof ruleFormSchema>

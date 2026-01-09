import { z } from 'zod'
import { RuleStatusValues, RuleTypeValues, CprTypeValues } from '~/types'

// Her antager vi, at RuleStatus, RuleType, CprType er string unions
export const ruleFormSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
  
  type: z.enum(RuleTypeValues),
  status: z.enum(RuleStatusValues),
  relatedBankAccounts: z.array(z.string()).min(1),

  matchText: z.array(z.string()).optional(),
  matchCounterparty: z.array(z.string()).optional(),
  matchType: z.array(z.string()).optional(),

  matchAmountMin: z.number().optional(),
  matchAmountMax: z.number().optional(),

  accountingPrimaryAccount: z.string().optional(),
  accountingSecondaryAccount: z.string().optional(),
  accountingTertiaryAccount: z.string().optional(),

  accountingText: z.string().optional(),

  accountingCprType: z.enum(CprTypeValues),
  accountingCprNumber: z.string().optional(),

  accountingNotifyTo: z
    .string()
    .email()
    .nullable()
    .refine(val => !val || val.endsWith('@randers.dk'), { message: 'Email skal være @randers.dk' }),
    
  accountingNote: z.string().nullable(),

  accountingAttachmentName: z.array(z.string()).optional(),
  accountingAttachmentMimetype: z.array(z.string()).optional(),
  accountingAttachmentData: z.array(z.string()).optional(),

  ruleTags: z.array(z.string()).optional()
})

export type RuleFormSchema = z.infer<typeof ruleFormSchema>

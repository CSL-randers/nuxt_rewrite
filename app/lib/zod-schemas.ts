import { z } from 'zod'
import { RuleStatusValues, RuleTypeValues, CprTypeValues, RunStatusValues, DocumentTypeValues, ErpSupplierValues, BookingStatusValues } from '~/lib/db/schema'

const ruleBaseSchema = z.object({
  type: z.enum(RuleTypeValues),
  status: z.enum(RuleStatusValues),

  relatedBankAccounts: z.array(z.string()).min(1, {
    message: 'Mindst én bankkonto skal vælges',
  }),

  lastUsed: z.date().optional(),

  matchText: z.array(z.string().min(1)).optional(),
  matchCounterparty: z.array(z.string().min(1)).optional(),
  matchType: z.array(z.string()).optional(),

  matchAmountMin: z.number().optional(),
  matchAmountMax: z.number().optional(),

  accountingPrimaryAccount: z.string().min(1, 'Artskonto er påkrævet'),

  accountingSecondaryAccount: z.string().optional(),
  accountingTertiaryAccount: z.string().optional(),

  accountingText: z.string().max(255).optional(),

  accountingCprType: z.enum(CprTypeValues).optional(),
  accountingCprNumber: z
    .string()
    .regex(/^\d{10}$/, 'CPR skal være 10 cifre')
    .optional(),

  accountingNotifyTo: z
    .string()
    .refine(
      (v) => v.endsWith('@randers.dk'),
      'Email skal ende med @randers.dk'
    )
    .optional(),

  accountingNote: z.string().max(500).optional(),

  accountingAttachmentName: z.array(z.string()).optional(),
  accountingAttachmentMimetype: z.array(z.string()).optional(),
  accountingAttachmentData: z.array(z.string()).optional(),

  ruleTags: z.array(z.number().int()).optional(),
});

const ruleFormSchema = ruleBaseSchema.superRefine((data, ctx) => {
  const hasPrimary = !!data.accountingPrimaryAccount;
  const hasSecondary = !!data.accountingSecondaryAccount;
  const hasTertiary = !!data.accountingTertiaryAccount;

  // 🎯 Artskonto → præcis én af secondary / tertiary
  if (hasPrimary && hasSecondary === hasTertiary) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'Når artskonto er udfyldt, skal enten PSP-element eller omkostningssted udfyldes (men ikke begge)',
      path: ['accountingSecondaryAccount'],
    });
  }

  // 💰 Beløbsinterval
  if (
    data.matchAmountMin !== undefined &&
    data.matchAmountMax !== undefined &&
    data.matchAmountMin > data.matchAmountMax
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Minimumsbeløb må ikke være større end maksimumsbeløb',
      path: ['matchAmountMin'],
    });
  }
});

export const createRuleSchema = ruleFormSchema;

export const updateRuleSchema = ruleFormSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    'Der skal ændres mindst ét felt for at gemme ændringer'
  );
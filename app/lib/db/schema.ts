import { z } from 'zod'
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { pgTable, integer, boolean, text, date, numeric, pgEnum, bigserial } from "drizzle-orm/pg-core";
import { createRuleSchema } from '../zod-schemas';
import { id } from 'zod/v4/locales';

export const RuleStatusValues = ['aktiv', 'inaktiv'] as const
export const RuleTypeValues = ['standard', 'undtagelse', 'engangs'] as const
export const CprTypeValues = ['ingen', 'statisk', 'dynamisk'] as const
export const RunStatusValues = ['afventer', 'indlæser', 'udført', 'fejl'] as const
export const DocumentTypeValues = ['afstemning', 'postering'] as const
export const ErpSupplierValues = ['KMD', 'andet'] as const
export const BookingStatusValues = ['bogført', 'åben'] as const
export type RuleStatus = typeof RuleStatusValues[number]
export type RuleType = typeof RuleTypeValues[number]
export type CprType = typeof CprTypeValues[number]
export type RunStatus = typeof RunStatusValues[number]
export type DocumentType = typeof DocumentTypeValues[number]
export type ErpSupplier = typeof ErpSupplierValues[number]
export type BookingStatus = typeof BookingStatusValues[number]
export const ruleTypeEnum = pgEnum('rule_type', RuleTypeValues);
export const ruleStatusEnum = pgEnum('rule_status', RuleStatusValues);
export const cprTypeEnum = pgEnum('cpr_type', CprTypeValues);
export const runStatusEnum = pgEnum('run_status', RunStatusValues);
export const documentTypeEnum = pgEnum('document_type', DocumentTypeValues);
export const erpSupplierEnum = pgEnum('erp_supplier', ErpSupplierValues);

export const RuleTag = pgTable('rule_tag', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
})

export const BankAccount = pgTable('bank_account', {
  id: text().primaryKey(),
  name: text().notNull(),
  statusAccount: integer().notNull()
})

export const Rule = pgTable('rule', {
  id: bigserial({ mode: 'number' }).primaryKey(),
  type: ruleTypeEnum(),
  status: ruleStatusEnum(),
  relatedBankAccounts: text().array().notNull().references(() => BankAccount.id),
  lastUsed: date({ mode: "date" }),
  createdAt: date({ mode: "date" }).$default(() => new Date()),
  updatedAt: date({ mode: "date" }).$default(() => new Date()).$onUpdate(() => new Date()),
  matchText: text().array(),
  matchCounterparty: text().array(),
  matchType: text().array().references(() => TransactionType.id),
  matchAmountMin: numeric(),
  matchAmountMax: numeric(),
  accountingPrimaryAccount: text().notNull(), // Artskonto i Opus
  accountingSecondaryAccount: text(), // PSP-element i Opus
  accountingTertiaryAccount: text(), // Omkostningssted i Opus
  accountingText: text(),
  accountingCprType: cprTypeEnum(),
  accountingCprNumber: text(),
  accountingNotifyTo: text(),
  accountingNote: text(),
  accountingAttachmentName: text().array(),
  accountingAttachmentFileExtension: text().array(),
  accountingAttachmentData: text().array(),
  ruleTags: integer().array().references(() => RuleTag.id),   
})

export const ruleInsertBaseSchema = createInsertSchema(Rule).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastUsed: true,
})

export const Transaction = pgTable('transaction', {
  id: text().primaryKey(),
  bookingDate: integer().notNull(),
  bankAccount: text().notNull(),
  bankAccountName: text().notNull(),
  amount: integer().notNull(),
  transactionType: text().notNull(),
  counterpart: text().notNull(),
  references: text().array().notNull(),
  ruleApplied: integer().references(() => Rule.id),
  status: text().notNull()
})

export const TransactionType = pgTable('transaction_type', {
  id: text().primaryKey()
})

export const MasterData = pgTable('master_data', {
  id: bigserial({ mode: 'number' }).primaryKey(),
  accessToken: text(),
  refreshToken: text(),
  adminName: text(),
  adminEmail: text(),
  adminId: text(),
  erpSupplier: erpSupplierEnum(),
  activeIntegration: boolean().notNull().default(false),
  authStatus: text()
})

export const Document = pgTable('document', {
  id: text().primaryKey(),
  type: documentTypeEnum(),
  bookingDate: date({ mode: "date" }).notNull(),
  content: text().notNull(),
  filename: text().notNull(),
  fileExtension: text().notNull(),
})

export const Run = pgTable('run', {
  id: bigserial({ mode: 'number' }).primaryKey(),  
  bookingDate: date({ mode: "date" }).notNull(),
  status: runStatusEnum(),
  error: text().array(),
  transactions: text().array(),
  docs: text().array()
})

export const InsertRuleSchema =
  ruleInsertBaseSchema.merge(createRuleSchema);

export type Run = typeof Run
export type Rule = typeof Rule
export type Transaction = typeof Transaction
export type BankAccount = typeof BankAccount
export type RuleTag = typeof RuleTag
export type MasterData = typeof MasterData
export type Document = typeof Document
import { pgEnum } from "drizzle-orm/pg-core";

export const ruleStatusValues = ['aktiv', 'inaktiv'] as const
export const ruleTypeValues = ['standard', 'undtagelse', 'engangs'] as const
export const cprTypeValues = ['ingen', 'statisk', 'dynamisk'] as const
export const runStatusValues = ['afventer', 'indlæser', 'udført', 'fejl'] as const
export const documentTypeValues = ['afstemning', 'postering'] as const
export const erpSupplierValues = ['KMD', 'andet'] as const
export const bookingStatusValues = ['bogført', 'åben'] as const
export type RuleStatus = typeof ruleStatusValues[number]
export type RuleType = typeof ruleTypeValues[number]
export type CprType = typeof cprTypeValues[number]
export type RunStatus = typeof runStatusValues[number]
export type DocumentType = typeof documentTypeValues[number]
export type ErpSupplier = typeof erpSupplierValues[number]
export type BookingStatus = typeof bookingStatusValues[number]
export const ruleTypeEnum = pgEnum('rule_type', ruleStatusValues)
export const ruleStatusEnum = pgEnum('rule_status', ruleTypeValues)
export const cprTypeEnum = pgEnum('cpr_type', cprTypeValues)
export const runStatusEnum = pgEnum('run_status', runStatusValues)
export const documentTypeEnum = pgEnum('document_type', documentTypeValues)
export const erpSupplierEnum = pgEnum('erp_supplier', erpSupplierValues)
export const bookingStatusEnum = pgEnum('booking_status', bookingStatusValues)

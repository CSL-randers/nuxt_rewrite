import { pgEnum } from "drizzle-orm/pg-core";

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
export const ruleTypeEnum = pgEnum('rule_type', RuleTypeValues)
export const ruleStatusEnum = pgEnum('rule_status', RuleStatusValues)
export const cprTypeEnum = pgEnum('cpr_type', CprTypeValues)
export const runStatusEnum = pgEnum('run_status', RunStatusValues)
export const documentTypeEnum = pgEnum('document_type', DocumentTypeValues)
export const erpSupplierEnum = pgEnum('erp_supplier', ErpSupplierValues)
export const bookingStatusEnum = pgEnum('booking_status', BookingStatusValues)

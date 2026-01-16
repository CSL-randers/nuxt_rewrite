import { z } from "zod"
import { pgTable, text, integer, boolean } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema, createSelectSchema } from "drizzle-zod"
import { erpSupplierEnum } from "./enums"

const ErpMetaData = pgTable('erp_master_data', {
  erpSupplier: erpSupplierEnum().primaryKey(),
  erpErrorAccount: text(),
  activeIntegration: boolean().notNull().default(true),
  prodEnvironment: text(),
  municipalityCode: integer(),
  compCode: text(),
  integrationId: text(), // e.g., "6ROB"
  integrationFileNameMask: text(), // e.g., "ZFIR_KMD_Opus_Posteringer_IND_xxx_zzzz_yyyymmdd_hhmmss.xml"
})

export const erpMetaDataInsertSchema = createInsertSchema(ErpMetaData)
export const erpMetaDataUpdateSchema = createUpdateSchema(ErpMetaData)
export const erpMetaDataSelectSchema = createSelectSchema(ErpMetaData)

export type ErpMetaDataInsertSchema = z.infer<typeof erpMetaDataInsertSchema>
export type ErpMetaDataUpdateSchema = z.infer<typeof erpMetaDataUpdateSchema>
export type ErpMetaDataSelectSchema = z.infer<typeof erpMetaDataSelectSchema>
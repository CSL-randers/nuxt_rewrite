import { z } from "zod"
import { pgTable, text, boolean } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema, createSelectSchema } from "drizzle-zod"
import { erpSupplierEnum } from "./enums"

const ErpMetaData = pgTable('erp_master_data', {
  erpSupplier: erpSupplierEnum().primaryKey(),
  erpErrorAccount: text(), // e.g. "95999999"
  activeIntegration: boolean().notNull().default(true),
  prodEnvironment: text(), // e.g. "P04"
  municipalityCode: text(), // e.g. 730
  compCode: text().default("0020"),
  integrationId: text(), // e.g. 6ROB
  integrationFileNameMask: text().default("ZFIR_KMD_Opus_Posteringer_IND_xxx_zzzz_yyyymmdd_hhmmss.xml"),
  primaryAccountLabel: text().default("Artskonto"),
  secondaryAccountLabel: text().default("PSP-element"),
  tertiaryAccountLabel: text().default("Omkostningssted")
})

export const erpMetaDataInsertSchema = createInsertSchema(ErpMetaData)
export const erpMetaDataUpdateSchema = createUpdateSchema(ErpMetaData)
export const erpMetaDataSelectSchema = createSelectSchema(ErpMetaData)

export type ErpMetaDataInsertSchema = z.infer<typeof erpMetaDataInsertSchema>
export type ErpMetaDataUpdateSchema = z.infer<typeof erpMetaDataUpdateSchema>
export type ErpMetaDataSelectSchema = z.infer<typeof erpMetaDataSelectSchema>
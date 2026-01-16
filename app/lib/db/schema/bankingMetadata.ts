import { z } from "zod"
import { pgTable, text, integer } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema, createSelectSchema } from "drizzle-zod"

const bankingMetaData = pgTable('banking_master_data', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  serviceProvider: text(),
  servicerProviderId: text(), // ErpApiKey hos leverandøren, bruges til at lave hmac hash
  passcode: text() // Kunde Kode hos leverandøren, bruges til at lave token
})


export const bankingMetaDataInsertSchema = createInsertSchema(bankingMetaData)
export const bankingMetaDataUpdateSchema = createUpdateSchema(bankingMetaData)
export const bankingMetaDataSelectSchema = createSelectSchema(bankingMetaData)

export type BankingMetaDataInsertSchema = z.infer<typeof bankingMetaDataInsertSchema>
export type BankingMetaDataUpdateSchema = z.infer<typeof bankingMetaDataUpdateSchema>
export type BankingMetaDataSelectSchema = z.infer<typeof bankingMetaDataSelectSchema>
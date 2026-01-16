import { z } from "zod"
import { pgTable, text, date, uuid } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { documentTypeEnum } from "./enums"

// Table will only be populated with data during batch runs
export const Document = pgTable('document', {
  id: uuid().defaultRandom().primaryKey(),
  type: documentTypeEnum(),
  bookingDate: date({ mode: "date" }).notNull(),
  content: text().notNull(),
  filename: text().notNull(),
  fileExtension: text().notNull(),
})

export const documentInsertSchema = createInsertSchema(Document)
export const documentSelectSchema = createSelectSchema(Document)

export type DocumentInsertSchema = z.infer<typeof documentInsertSchema>
export type DocumentSelectSchema = z.infer<typeof documentSelectSchema>
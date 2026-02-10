import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { run } from "./run";

export const ErpRequest = pgTable("erp_request", {
  id: text().primaryKey(),
  runId: uuid("run_id").notNull().references(() => run.id),
  payload: text("payload"),
});

export const ErpResponse = pgTable("erp_response", {
  id: text().primaryKey(),
  requestId: text("request_id").references(() => ErpRequest.id).unique(),
  statusText: text("status_text"),
  payload: text("payload"),
});

export const erpRequestInsertSchema = createInsertSchema(ErpRequest);
export type ErpRequestInsertSchema = z.infer<typeof erpRequestInsertSchema>;

export const erpResponseInsertSchema = createInsertSchema(ErpResponse);
export const erpResponseSelectSchema = createSelectSchema(ErpResponse);
export type ErpResponseInsertSchema = z.infer<typeof erpResponseInsertSchema>;
export type ErpResponseSelectSchema = z.infer<typeof erpResponseSelectSchema>;

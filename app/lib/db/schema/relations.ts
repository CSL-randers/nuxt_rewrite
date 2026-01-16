import { relations } from "drizzle-orm";
import { Rule } from "./rule";
import { RuleTag } from "./ruleTag";
import { Document } from "./document";
import { Transaction } from "./transaction";
import { Run } from "./run";
import { BankingRequest } from "./bankingRequest";
import { BankingResponse } from "./bankingResponse";
import { ErpRequest } from "./erpRequest";
import { ErpResponse } from "./erpResponse";

export const ruleRelations = relations(Rule, ({ many }) => ({
  tags: many(RuleTag),
}));

export const runRelations = relations(Run, ({ many }) => ({
  transactions: many(Transaction),
  documents: many(Document),
  bankingRequests: many(BankingRequest),
  erpRequests: many(ErpRequest),
}));

export const bankingRequestRelations = relations(
  BankingRequest,
  ({ one }) => ({
    response: one(BankingResponse),
    run: one(Run, {
      fields: [BankingRequest.runId],
      references: [Run.id],
    }),
  })
);

export const bankingResponseRelations = relations(
  BankingResponse,
  ({ one }) => ({
    request: one(BankingRequest, {
      fields: [BankingResponse.requestId],
      references: [BankingRequest.id],
    }),
    run: one(Run, {
      fields: [BankingResponse.runId],
      references: [Run.id],
    }),
  })
);

export const erpRequestRelations = relations(
  ErpRequest,
  ({ one }) => ({
    response: one(ErpResponse),
    run: one(Run, {
      fields: [ErpRequest.runId],
      references: [Run.id],
    }),
  })
);

export const erpResponseRelations = relations(
  ErpResponse,
  ({ one }) => ({
    request: one(ErpRequest, {
      fields: [ErpResponse.requestId],
      references: [ErpRequest.id],
    }),
    run: one(Run, {
      fields: [ErpResponse.runId],
      references: [Run.id],
    }),
  })
);

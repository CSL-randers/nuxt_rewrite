import { relations } from "drizzle-orm";
import { rule, ruleBankAccount, ruleRuleTag } from "./rule";
import { RuleTag } from "./ruleTag";
import { Document } from "./document";
import { Transaction } from "./transaction";
import { Run } from "./run";
import { BankingRequest } from "./bankingRequest";
import { BankingResponse } from "./bankingResponse";
import { ErpRequest } from "./erpRequest";
import { ErpResponse } from "./erpResponse";
import { account } from "./account";

export const ruleRelations = relations(rule, ({ many }) => ({
  bankAccounts: many(ruleBankAccount),
  tags: many(ruleRuleTag),
}));

export const ruleBankAccountRelations = relations(ruleBankAccount, ({ one }) => ({
  rule: one(rule, { fields: [ruleBankAccount.ruleId], references: [rule.id] }),
  account: one(account, { fields: [ruleBankAccount.bankAccountId], references: [account.id] }),
}));

export const ruleRuleTagRelations = relations(ruleRuleTag, ({ one }) => ({
  rule: one(rule, { fields: [ruleRuleTag.ruleId], references: [rule.id] }),
  tag: one(RuleTag, { fields: [ruleRuleTag.ruleTagId], references: [RuleTag.id] }),
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

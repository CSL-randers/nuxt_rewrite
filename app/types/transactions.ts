import type { BookingStatus, CprType } from "~/lib/db/schema";

export type OpenTransaction = {
  id: string;
  runId: string;
  bookingDate: string;
  amount: number;
  accountId: string;
  bankAccountName: string | null;
  status: BookingStatus | null;
  ruleApplied: number | null;
  transactionType: string | null;
  counterpart: string | null;
  references: string[];
};

export type ManualPostingAttachment = {
  name: string;
  type: string;
  data: string;
};

export type ManualBookingPayload = {
  primaryAccount: string;
  secondaryAccount?: string | null;
  tertiaryAccount?: string | null;
  text?: string | null;
  cprType: CprType;
  cprNumber?: string | null;
  notifyTo?: string | null;
  note?: string | null;
  attachments?: ManualPostingAttachment[];
};

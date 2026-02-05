CREATE TYPE "public"."booking_status" AS ENUM('bogført', 'åben');--> statement-breakpoint
CREATE TYPE "public"."cpr_type" AS ENUM('ingen', 'statisk', 'dynamisk');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('afstemning', 'postering');--> statement-breakpoint
CREATE TYPE "public"."erp_supplier" AS ENUM('KMD', 'andet');--> statement-breakpoint
CREATE TYPE "public"."rule_status" AS ENUM('aktiv', 'inaktiv');--> statement-breakpoint
CREATE TYPE "public"."rule_type" AS ENUM('standard', 'undtagelse', 'engangs');--> statement-breakpoint
CREATE TYPE "public"."run_status" AS ENUM('afventer', 'indlæser', 'udført', 'fejl');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"statusAccount" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banking_request" (
	"id" text PRIMARY KEY NOT NULL,
	"runId" uuid NOT NULL,
	"payload" json
);
--> statement-breakpoint
CREATE TABLE "banking_response" (
	"id" text PRIMARY KEY NOT NULL,
	"requestId" text,
	"runId" uuid NOT NULL,
	"status" text,
	"error" text[],
	"transactions" json[],
	CONSTRAINT "banking_response_requestId_unique" UNIQUE("requestId")
);
--> statement-breakpoint
CREATE TABLE "document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "document_type",
	"bookingDate" date NOT NULL,
	"content" text NOT NULL,
	"filename" text NOT NULL,
	"fileExtension" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp_request" (
	"id" text PRIMARY KEY NOT NULL,
	"runId" uuid NOT NULL,
	"payload" json
);
--> statement-breakpoint
CREATE TABLE "erp_response" (
	"id" text PRIMARY KEY NOT NULL,
	"requestId" text,
	"runId" uuid NOT NULL,
	"status" text,
	"error" text,
	"payload" text,
	CONSTRAINT "erp_response_requestId_unique" UNIQUE("requestId")
);
--> statement-breakpoint
CREATE TABLE "rule" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "rule_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"lastUsed" date,
	"createdAt" date DEFAULT now(),
	"updatedAt" date,
	"lockedAt" date,
	"lockedBy" text,
	"currentVersionId" bigint NOT NULL,
	"type" "rule_type",
	"status" "rule_status",
	"matchText" text[],
	"matchPrimaryReference" text[],
	"matchId" text[],
	"matchBatch" text[],
	"matchEndToEndId" text[],
	"matchOcrReference" text[],
	"matchDebtorsPaymentId" text[],
	"matchDebtorText" text[],
	"matchDebtorMessage" text[],
	"matchCreditorText" text[],
	"matchCreditorMessage" text[],
	"matchDebtorId" text[],
	"matchDebtorName" text[],
	"matchCreditorId" text[],
	"matchCreditorName" text[],
	"matchType" text[],
	"matchTxDomain" text[],
	"matchTxFamily" text[],
	"matchTxSubFamily" text[],
	"matchAmountMin" numeric,
	"matchAmountMax" numeric,
	"accountingPrimaryAccount" text NOT NULL,
	"accountingSecondaryAccount" text,
	"accountingTertiaryAccount" text,
	"accountingText" text,
	"accountingCprType" "cpr_type",
	"accountingCprNumber" text,
	"accountingNotifyTo" text,
	"accountingNote" text,
	"accountingAttachmentName" text[],
	"accountingAttachmentFileExtension" text[],
	"accountingAttachmentData" text[]
);
--> statement-breakpoint
CREATE TABLE "rule_bank_account" (
	"ruleId" integer NOT NULL,
	"bankAccountId" text NOT NULL,
	CONSTRAINT "rule_bank_account_ruleId_bankAccountId_pk" PRIMARY KEY("ruleId","bankAccountId")
);
--> statement-breakpoint
CREATE TABLE "rule_rule_tag" (
	"ruleId" integer NOT NULL,
	"ruleTagId" text NOT NULL,
	CONSTRAINT "rule_rule_tag_ruleId_ruleTagId_pk" PRIMARY KEY("ruleId","ruleTagId")
);
--> statement-breakpoint
CREATE TABLE "rule_tag" (
	"id" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rule_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ruleId" integer NOT NULL,
	"version" bigint NOT NULL,
	"content" jsonb NOT NULL,
	"createdAt" date DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bookingDate" date NOT NULL,
	"status" "run_status",
	"errors" json[],
	"transactions" json[],
	"docs" json[],
	"bankingRequests" json,
	"bankingResponses" json,
	"erpRequests" json,
	"erpResponses" json
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"sequence" integer NOT NULL,
	"bookingDate" date NOT NULL,
	"status" "booking_status" DEFAULT 'åben' NOT NULL,
	"ruleApplied" integer,
	"lockedAt" date,
	"lockedBy" text,
	"account" text NOT NULL,
	"name" text NOT NULL,
	"amount" numeric NOT NULL,
	"type" text,
	"text" text,
	"primaryReference" text,
	"id" text,
	"batch" text,
	"endToEndId" text,
	"ocrReference" text,
	"debtorsPaymentId" text,
	"debtorText" text,
	"debtorMessage" text,
	"creditorText" text,
	"creditorMessage" text,
	"debtorId" text,
	"debtorName" text,
	"creditorId" text,
	"creditorName" text,
	"txCodeDomain" text,
	"txCodeFamily" text,
	"txCodeSubFamily" text
);
--> statement-breakpoint
ALTER TABLE "banking_request" ADD CONSTRAINT "banking_request_runId_run_id_fk" FOREIGN KEY ("runId") REFERENCES "public"."run"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking_response" ADD CONSTRAINT "banking_response_requestId_banking_request_id_fk" FOREIGN KEY ("requestId") REFERENCES "public"."banking_request"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking_response" ADD CONSTRAINT "banking_response_runId_run_id_fk" FOREIGN KEY ("runId") REFERENCES "public"."run"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_request" ADD CONSTRAINT "erp_request_runId_run_id_fk" FOREIGN KEY ("runId") REFERENCES "public"."run"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_response" ADD CONSTRAINT "erp_response_requestId_erp_request_id_fk" FOREIGN KEY ("requestId") REFERENCES "public"."erp_request"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_response" ADD CONSTRAINT "erp_response_runId_run_id_fk" FOREIGN KEY ("runId") REFERENCES "public"."run"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_bank_account" ADD CONSTRAINT "rule_bank_account_ruleId_rule_id_fk" FOREIGN KEY ("ruleId") REFERENCES "public"."rule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_bank_account" ADD CONSTRAINT "rule_bank_account_bankAccountId_account_id_fk" FOREIGN KEY ("bankAccountId") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_rule_tag" ADD CONSTRAINT "rule_rule_tag_ruleId_rule_id_fk" FOREIGN KEY ("ruleId") REFERENCES "public"."rule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_rule_tag" ADD CONSTRAINT "rule_rule_tag_ruleTagId_rule_tag_id_fk" FOREIGN KEY ("ruleTagId") REFERENCES "public"."rule_tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_version" ADD CONSTRAINT "rule_version_ruleId_rule_id_fk" FOREIGN KEY ("ruleId") REFERENCES "public"."rule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_ruleApplied_rule_id_fk" FOREIGN KEY ("ruleApplied") REFERENCES "public"."rule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_account_account_id_fk" FOREIGN KEY ("account") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_id" ON "transaction" USING btree ("account","sequence");
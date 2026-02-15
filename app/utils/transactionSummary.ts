import type { OpenTransaction } from "~/types/transactions";

const currencyFormatter = new Intl.NumberFormat("da-DK", {
  style: "currency",
  currency: "DKK",
});

const dateFormatter = new Intl.DateTimeFormat("da-DK", {
  dateStyle: "medium",
});

export type TransactionSummarySection =
  | {
      key: "part" | "fritekst";
      label: string;
      items: Array<{ label: string; value: string }>;
    }
  | {
      key: "referencer";
      label: string;
      chips: string[];
    };

export type TransactionSummary = {
  amount: { label: string; value: string };
  bookingDate: { label: string; value: string };
  transactionId: { label: string; value: string };
  sections: TransactionSummarySection[];
};

export function buildTransactionSummary(transaction: OpenTransaction): TransactionSummary {
  const amountValue = typeof transaction.amount === "number" ? transaction.amount : 0;
  const references = Array.isArray(transaction.references)
    ? transaction.references.filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
    : [];

  const sections: TransactionSummarySection[] = [];

  sections.push({
    key: "part",
    label: "Part",
    items: [
      {
        label: "Modpart",
        value: transaction.counterpart ?? "Ukendt modpart",
      },
    ],
  });

  sections.push({
    key: "fritekst",
    label: "Fritekst",
    items: [
      {
        label: "Transaktionstype",
        value: transaction.transactionType ?? "Ukendt type",
      },
      {
        label: "Kørsels-ID",
        value: transaction.runId,
      },
    ],
  });

  if (references.length) {
    sections.push({
      key: "referencer",
      label: "Referencer",
      chips: references,
    });
  }

  return {
    amount: {
      label: "Beløb",
      value: currencyFormatter.format(amountValue),
    },
    bookingDate: {
      label: "Bogføringsdato",
      value: formatDate(transaction.bookingDate),
    },
    transactionId: {
      label: "Transaktions-ID",
      value: transaction.id,
    },
    sections,
  };
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return dateFormatter.format(new Date());
  }
  return dateFormatter.format(parsed);
}

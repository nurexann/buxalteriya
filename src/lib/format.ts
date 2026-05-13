export const numberFormatter = new Intl.NumberFormat("uz-UZ", {
  maximumFractionDigits: 2
});

export const currencyFormatter = new Intl.NumberFormat("uz-UZ", {
  style: "currency",
  currency: "UZS",
  maximumFractionDigits: 0
});

export function formatNumber(value: number | null | undefined) {
  return numberFormatter.format(Number(value || 0));
}

export function formatCurrency(value: number | null | undefined) {
  return currencyFormatter.format(Number(value || 0));
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("uz-UZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tashkent"
  }).format(new Date(value));
}

export function todayIsoDate() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tashkent"
  }).format(new Date());
}

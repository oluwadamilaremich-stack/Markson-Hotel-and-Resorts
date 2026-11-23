const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

/** Prices are stored in whole naira. */
export function formatNaira(amount: number) {
  return naira.format(amount);
}

export function formatSqft(sqft: number) {
  return `${sqft.toLocaleString("en-US")} sq. ft.`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

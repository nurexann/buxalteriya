export type SaleCalculationInput = {
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  discount?: number;
};

export function calculateSaleTotals(input: SaleCalculationInput) {
  const discount = input.discount || 0;
  const grossAmount = input.salePrice * input.quantity;
  const totalAmount = grossAmount - discount;
  const profit =
    (input.salePrice - input.purchasePrice) * input.quantity - discount;

  return {
    grossAmount,
    totalAmount,
    profit
  };
}

export function ensureEnoughStock(currentQuantity: number, requestedQuantity: number) {
  if (requestedQuantity <= 0) {
    throw new Error("quantity_positive_required");
  }

  if (currentQuantity < requestedQuantity) {
    throw new Error("insufficient_stock");
  }
}

export function calculateMoneyBalance(
  movements: Array<{ direction: "income" | "expense"; amount: number }>
) {
  return movements.reduce((balance, movement) => {
    return movement.direction === "income"
      ? balance + movement.amount
      : balance - movement.amount;
  }, 0);
}

export function daysUntilPurge(deletedAt: Date, now = new Date()) {
  const purgeAt = deletedAt.getTime() + 3 * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((purgeAt - now.getTime()) / (24 * 60 * 60 * 1000)));
}

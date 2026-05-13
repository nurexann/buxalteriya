import { randomUUID } from "node:crypto";
import {
  calculateMoneyBalance,
  calculateSaleTotals,
  ensureEnoughStock
} from "@/lib/business/calculations";

export type LedgerProduct = {
  id: string;
  name: string;
  sku: string;
  categoryId?: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  minQuantity: number;
  deletedAt?: Date | null;
};

export type LedgerState = {
  products: LedgerProduct[];
  purchases: Array<Record<string, unknown>>;
  sales: Array<Record<string, unknown>>;
  expenses: Array<Record<string, unknown>>;
  stockMovements: Array<Record<string, unknown>>;
  moneyMovements: Array<{ id: string; direction: "income" | "expense"; amount: number; type: string }>;
  auditLogs: Array<Record<string, unknown>>;
};

export function createEmptyLedger(): LedgerState {
  return {
    products: [],
    purchases: [],
    sales: [],
    expenses: [],
    stockMovements: [],
    moneyMovements: [],
    auditLogs: []
  };
}

function audit(state: LedgerState, action: string, entityType: string, entityId: string) {
  state.auditLogs.push({
    id: randomUUID(),
    action,
    entityType,
    entityId,
    createdAt: new Date()
  });
}

function findProduct(state: LedgerState, productId: string) {
  const product = state.products.find((item) => item.id === productId);

  if (!product || product.deletedAt) {
    throw new Error("product_not_found");
  }

  return product;
}

export function createProduct(
  state: LedgerState,
  input: Omit<LedgerProduct, "id" | "quantity"> & { initialQuantity?: number }
) {
  const skuExists = state.products.some(
    (product) => product.sku.toLowerCase() === input.sku.toLowerCase()
  );

  if (skuExists) {
    throw new Error("duplicate_sku");
  }

  const product: LedgerProduct = {
    ...input,
    id: randomUUID(),
    quantity: input.initialQuantity || 0
  };

  state.products.push(product);

  if (product.quantity > 0) {
    state.stockMovements.push({
      id: randomUUID(),
      productId: product.id,
      type: "initial",
      quantity: product.quantity,
      oldQuantity: 0,
      newQuantity: product.quantity
    });
  }

  audit(state, "product_create", "product", product.id);
  return product;
}

export function createPurchase(
  state: LedgerState,
  input: { productId: string; quantity: number; unitPrice: number }
) {
  if (input.quantity <= 0) {
    throw new Error("quantity_positive_required");
  }

  const product = findProduct(state, input.productId);
  const oldQuantity = product.quantity;
  const totalAmount = input.quantity * input.unitPrice;
  const purchase = {
    id: randomUUID(),
    productId: product.id,
    quantity: input.quantity,
    unitPrice: input.unitPrice,
    totalAmount,
    status: "completed"
  };

  product.quantity += input.quantity;
  product.purchasePrice = input.unitPrice;
  state.purchases.push(purchase);
  state.stockMovements.push({
    id: randomUUID(),
    productId: product.id,
    type: "purchase",
    quantity: input.quantity,
    oldQuantity,
    newQuantity: product.quantity
  });
  state.moneyMovements.push({
    id: randomUUID(),
    type: "purchase_expense",
    direction: "expense",
    amount: totalAmount
  });
  audit(state, "stock_in", "purchase", String(purchase.id));

  return purchase;
}

export function createSale(
  state: LedgerState,
  input: { productId: string; quantity: number; unitPrice?: number; discount?: number }
) {
  const product = findProduct(state, input.productId);
  ensureEnoughStock(product.quantity, input.quantity);

  const salePrice = input.unitPrice ?? product.salePrice;
  const totals = calculateSaleTotals({
    purchasePrice: product.purchasePrice,
    salePrice,
    quantity: input.quantity,
    discount: input.discount
  });

  if (totals.totalAmount < 0) {
    throw new Error("total_negative");
  }

  const oldQuantity = product.quantity;
  const sale = {
    id: randomUUID(),
    productId: product.id,
    quantity: input.quantity,
    unitPrice: salePrice,
    discount: input.discount || 0,
    totalAmount: totals.totalAmount,
    profit: totals.profit,
    status: "completed"
  };

  product.quantity -= input.quantity;
  state.sales.push(sale);
  state.stockMovements.push({
    id: randomUUID(),
    productId: product.id,
    type: "sale",
    quantity: input.quantity,
    oldQuantity,
    newQuantity: product.quantity
  });
  state.moneyMovements.push({
    id: randomUUID(),
    type: "sale_income",
    direction: "income",
    amount: totals.totalAmount
  });
  audit(state, "sale_create", "sale", String(sale.id));

  return sale;
}

export function cancelSale(
  state: LedgerState,
  saleId: string,
  reason = "Test cancellation"
) {
  const sale = state.sales.find((item) => item.id === saleId) as
    | { id: string; productId: string; quantity: number; totalAmount: number; status: string }
    | undefined;

  if (!sale) {
    throw new Error("sale_not_found");
  }

  if (sale.status === "cancelled") {
    throw new Error("sale_already_cancelled");
  }

  const product = findProduct(state, sale.productId);
  const oldQuantity = product.quantity;

  sale.status = "cancelled";
  product.quantity += sale.quantity;
  state.stockMovements.push({
    id: randomUUID(),
    productId: product.id,
    type: "return",
    quantity: sale.quantity,
    oldQuantity,
    newQuantity: product.quantity,
    reason
  });
  state.moneyMovements.push({
    id: randomUUID(),
    type: "sale_cancel_reverse",
    direction: "expense",
    amount: sale.totalAmount
  });
  audit(state, "sale_cancel", "sale", sale.id);
}

export function createExpense(
  state: LedgerState,
  input: { title: string; category: string; amount: number }
) {
  if (input.amount <= 0) {
    throw new Error("amount_positive_required");
  }

  const expense = {
    id: randomUUID(),
    ...input,
    status: "completed"
  };

  state.expenses.push(expense);
  state.moneyMovements.push({
    id: randomUUID(),
    type: "manual_expense",
    direction: "expense",
    amount: input.amount
  });
  audit(state, "expense_create", "expense", expense.id);

  return expense;
}

export function softDeleteProduct(
  state: LedgerState,
  productId: string,
  deletedAt = new Date()
) {
  const product = findProduct(state, productId);
  product.deletedAt = deletedAt;
  audit(state, "product_soft_delete", "product", productId);
}

export function restoreProduct(state: LedgerState, productId: string) {
  const product = state.products.find((item) => item.id === productId);

  if (!product) {
    throw new Error("product_not_found");
  }

  product.deletedAt = null;
  audit(state, "product_restore", "product", productId);
}

export function purgeTrash(state: LedgerState, now = new Date()) {
  const cutoff = now.getTime() - 3 * 24 * 60 * 60 * 1000;
  const before = state.products.length;

  state.products = state.products.filter((product) => {
    if (!product.deletedAt || product.deletedAt.getTime() > cutoff) {
      return true;
    }

    const hasImportantRecords =
      state.sales.some((sale) => sale.productId === product.id) ||
      state.purchases.some((purchase) => purchase.productId === product.id) ||
      state.stockMovements.some((movement) => movement.productId === product.id);

    if (hasImportantRecords) {
      return true;
    }

    audit(state, "product_permanent_delete", "product", product.id);
    return false;
  });

  return before - state.products.length;
}

export function canPhysicallyDeleteEntity(entityType: string) {
  return ![
    "sales",
    "purchases",
    "stock_movements",
    "money_movements",
    "expenses",
    "audit_logs"
  ].includes(entityType);
}

export function currentBalance(state: LedgerState) {
  return calculateMoneyBalance(state.moneyMovements);
}

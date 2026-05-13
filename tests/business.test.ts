import { describe, expect, it } from "vitest";
import {
  calculateSaleTotals,
  daysUntilPurge,
  ensureEnoughStock
} from "@/lib/business/calculations";
import {
  cancelSale,
  canPhysicallyDeleteEntity,
  createEmptyLedger,
  createExpense,
  createProduct,
  createPurchase,
  createSale,
  currentBalance,
  purgeTrash,
  restoreProduct,
  softDeleteProduct
} from "@/lib/business/ledger";

describe("business ledger", () => {
  it("creates product and prevents duplicate SKU", () => {
    const ledger = createEmptyLedger();
    createProduct(ledger, {
      name: "Ko'ylak",
      sku: "SKU-001",
      purchasePrice: 10000,
      salePrice: 15000,
      minQuantity: 2,
      initialQuantity: 3
    });

    expect(ledger.products).toHaveLength(1);
    expect(ledger.products[0].quantity).toBe(3);
    expect(() =>
      createProduct(ledger, {
        name: "Boshqa",
        sku: "sku-001",
        purchasePrice: 1,
        salePrice: 2,
        minQuantity: 0
      })
    ).toThrow("duplicate_sku");
  });

  it("searches product by SKU shape", () => {
    const ledger = createEmptyLedger();
    createProduct(ledger, {
      name: "Sumka",
      sku: "BAG-77",
      purchasePrice: 70000,
      salePrice: 90000,
      minQuantity: 1
    });

    const found = ledger.products.find((product) =>
      product.sku.toLowerCase().includes("bag")
    );

    expect(found?.name).toBe("Sumka");
  });

  it("purchase increases stock and creates money expense", () => {
    const ledger = createEmptyLedger();
    const product = createProduct(ledger, {
      name: "Kepka",
      sku: "CAP-1",
      purchasePrice: 20000,
      salePrice: 30000,
      minQuantity: 2
    });

    createPurchase(ledger, {
      productId: product.id,
      quantity: 10,
      unitPrice: 22000
    });

    expect(product.quantity).toBe(10);
    expect(ledger.stockMovements.at(-1)?.type).toBe("purchase");
    expect(ledger.moneyMovements.at(-1)).toMatchObject({
      type: "purchase_expense",
      direction: "expense",
      amount: 220000
    });
  });

  it("sale decreases stock and creates money income", () => {
    const ledger = createEmptyLedger();
    const product = createProduct(ledger, {
      name: "Shim",
      sku: "PNT-1",
      purchasePrice: 50000,
      salePrice: 75000,
      minQuantity: 1,
      initialQuantity: 5
    });

    const sale = createSale(ledger, {
      productId: product.id,
      quantity: 2
    });

    expect(product.quantity).toBe(3);
    expect(sale.totalAmount).toBe(150000);
    expect(ledger.moneyMovements.at(-1)).toMatchObject({
      type: "sale_income",
      direction: "income"
    });
  });

  it("sale cannot exceed stock", () => {
    const ledger = createEmptyLedger();
    const product = createProduct(ledger, {
      name: "Oyoq kiyim",
      sku: "SHOE-1",
      purchasePrice: 100000,
      salePrice: 140000,
      minQuantity: 1,
      initialQuantity: 1
    });

    expect(() =>
      createSale(ledger, {
        productId: product.id,
        quantity: 2
      })
    ).toThrow("insufficient_stock");
    expect(() => ensureEnoughStock(1, 2)).toThrow("insufficient_stock");
  });

  it("calculates profit correctly", () => {
    expect(
      calculateSaleTotals({
        purchasePrice: 10000,
        salePrice: 15000,
        quantity: 2,
        discount: 0
      })
    ).toMatchObject({
      totalAmount: 30000,
      profit: 10000
    });
  });

  it("expense decreases balance", () => {
    const ledger = createEmptyLedger();
    createExpense(ledger, {
      title: "Reklama",
      category: "reklama",
      amount: 50000
    });

    expect(currentBalance(ledger)).toBe(-50000);
  });

  it("sale cancellation restores stock and reverses money", () => {
    const ledger = createEmptyLedger();
    const product = createProduct(ledger, {
      name: "Futbolka",
      sku: "TSHIRT-1",
      purchasePrice: 20000,
      salePrice: 35000,
      minQuantity: 1,
      initialQuantity: 4
    });
    const sale = createSale(ledger, {
      productId: product.id,
      quantity: 1
    });

    cancelSale(ledger, String(sale.id));

    expect(product.quantity).toBe(4);
    expect(sale.status).toBe("cancelled");
    expect(ledger.moneyMovements.at(-1)).toMatchObject({
      type: "sale_cancel_reverse",
      direction: "expense"
    });
  });

  it("soft deletes and restores product", () => {
    const ledger = createEmptyLedger();
    const product = createProduct(ledger, {
      name: "Soat",
      sku: "WATCH-1",
      purchasePrice: 80000,
      salePrice: 120000,
      minQuantity: 1
    });

    softDeleteProduct(ledger, product.id);
    expect(product.deletedAt).toBeInstanceOf(Date);

    restoreProduct(ledger, product.id);
    expect(product.deletedAt).toBeNull();
  });

  it("auto purge after 3 days only for products without important history", () => {
    const ledger = createEmptyLedger();
    const product = createProduct(ledger, {
      name: "Eski tovar",
      sku: "OLD-1",
      purchasePrice: 1,
      salePrice: 2,
      minQuantity: 0
    });
    softDeleteProduct(ledger, product.id, new Date("2026-05-01T00:00:00Z"));

    const purged = purgeTrash(ledger, new Date("2026-05-05T00:00:00Z"));

    expect(purged).toBe(1);
    expect(ledger.products).toHaveLength(0);
    expect(daysUntilPurge(new Date("2026-05-01T00:00:00Z"), new Date("2026-05-02T00:00:00Z"))).toBe(2);
  });

  it("important records are not physically deleted", () => {
    expect(canPhysicallyDeleteEntity("sales")).toBe(false);
    expect(canPhysicallyDeleteEntity("purchases")).toBe(false);
    expect(canPhysicallyDeleteEntity("stock_movements")).toBe(false);
    expect(canPhysicallyDeleteEntity("money_movements")).toBe(false);
    expect(canPhysicallyDeleteEntity("expenses")).toBe(false);
    expect(canPhysicallyDeleteEntity("audit_logs")).toBe(false);
    expect(canPhysicallyDeleteEntity("products")).toBe(true);
  });

  it("audit log is created for important operations", () => {
    const ledger = createEmptyLedger();
    const product = createProduct(ledger, {
      name: "Kamar",
      sku: "BELT-1",
      purchasePrice: 30000,
      salePrice: 50000,
      minQuantity: 1,
      initialQuantity: 2
    });
    createSale(ledger, {
      productId: product.id,
      quantity: 1
    });

    expect(ledger.auditLogs.map((log) => log.action)).toEqual([
      "product_create",
      "sale_create"
    ]);
  });
});

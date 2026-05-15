import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { todayIsoDate } from "@/lib/format";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { CategoryRow, ProductRow } from "@/lib/types";

export type SetupState = {
  configured: boolean;
  message?: string;
};

export const setupState: SetupState = {
  configured: isSupabaseConfigured(),
  message: isSupabaseConfigured()
    ? undefined
    : "Supabase env qiymatlari sozlanmagan. NEXT_PUBLIC_SUPABASE_URL va SUPABASE_SECRET_KEY yoki SUPABASE_SERVICE_ROLE_KEY qo'shing."
};

function supabaseOrNull() {
  return isSupabaseConfigured() ? getSupabaseAdmin() : null;
}

function startOfDayIso() {
  return `${todayIsoDate()}T00:00:00+05:00`;
}

function endOfDayIso() {
  return `${todayIsoDate()}T23:59:59+05:00`;
}

export async function getCategories({ includeDeleted = false } = {}) {
  const supabase = supabaseOrNull();

  if (!supabase) {
    return [] as CategoryRow[];
  }

  let query = supabase.from("categories").select("*").order("name");

  if (!includeDeleted) {
    query = query.is("deleted_at", null);
  }

  const { data } = await query;
  return (data || []) as CategoryRow[];
}

export async function getProducts({
  search,
  categoryId,
  lowStock,
  includeDeleted = false,
  limit = 200
}: {
  search?: string;
  categoryId?: string;
  lowStock?: boolean;
  includeDeleted?: boolean;
  limit?: number;
} = {}) {
  const supabase = supabaseOrNull();

  if (!supabase) {
    return [] as ProductRow[];
  }

  let query = supabase
    .from("products")
    .select("*, categories(id,name)")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (!includeDeleted) {
    query = query.is("deleted_at", null);
  }

  if (search) {
    const safeQ = search.replaceAll("%", "\\%").replaceAll("_", "\\_");
    query = query.or(`sku.ilike.%${safeQ}%,name.ilike.%${safeQ}%`);
  }

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data } = await query;
  let products = (data || []) as ProductRow[];

  if (lowStock) {
    products = products.filter(
      (product) => Number(product.min_quantity) > 0 && Number(product.quantity) <= Number(product.min_quantity)
    );
  }

  return products;
}

export async function getProduct(productId: string) {
  const supabase = supabaseOrNull();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("products")
    .select("*, categories(id,name)")
    .eq("id", productId)
    .single();

  return data as ProductRow | null;
}

export async function getDashboardData() {
  const supabase = supabaseOrNull();

  if (!supabase) {
    return {
      setup: setupState,
      productCount: 0,
      inventoryValue: 0,
      todaySalesAmount: 0,
      todayProfit: 0,
      moneyBalance: 0,
      todayPurchasesAmount: 0,
      todayExpensesAmount: 0,
      lowStock: [] as ProductRow[],
      recentMovements: [] as Array<Record<string, unknown>>,
      todaySales: [] as Array<Record<string, unknown>>,
      todayPurchases: [] as Array<Record<string, unknown>>,
      todayExpenses: [] as Array<Record<string, unknown>>
    };
  }

  const dayStart = startOfDayIso();
  const dayEnd = endOfDayIso();

  const [
    productsResult,
    salesResult,
    purchasesResult,
    expensesResult,
    balanceResult,
    movementsResult
  ] = await Promise.all([
    supabase.from("products").select("*, categories(id,name)").is("deleted_at", null),
    supabase
      .from("sales")
      .select("*")
      .eq("status", "completed")
      .gte("created_at", dayStart)
      .lte("created_at", dayEnd)
      .order("created_at", { ascending: false }),
    supabase
      .from("purchases")
      .select("*")
      .eq("status", "completed")
      .gte("created_at", dayStart)
      .lte("created_at", dayEnd)
      .order("created_at", { ascending: false }),
    supabase
      .from("expenses")
      .select("*")
      .eq("status", "completed")
      .gte("created_at", dayStart)
      .lte("created_at", dayEnd)
      .order("created_at", { ascending: false }),
    supabase.from("v_money_balance").select("*").single(),
    supabase
      .from("stock_movements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8)
  ]);

  const products = (productsResult.data || []) as ProductRow[];
  const todaySales = salesResult.data || [];
  const todayPurchases = purchasesResult.data || [];
  const todayExpenses = expensesResult.data || [];
  const balance = balanceResult.data as
    | { total_income: number; total_expense: number; balance: number }
    | null;

  return {
    setup: setupState,
    productCount: products.length,
    inventoryValue: products.reduce(
      (sum, product) => sum + Number(product.quantity) * Number(product.purchase_price),
      0
    ),
    todaySalesAmount: todaySales.reduce(
      (sum, sale) => sum + Number(sale.total_amount || 0),
      0
    ),
    todayProfit: todaySales.reduce((sum, sale) => sum + Number(sale.profit || 0), 0),
    moneyBalance: Number(balance?.balance || 0),
    todayPurchasesAmount: todayPurchases.reduce(
      (sum, purchase) => sum + Number(purchase.total_amount || 0),
      0
    ),
    todayExpensesAmount: todayExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0
    ),
    lowStock: products
      .filter(
        (product) => Number(product.min_quantity) > 0 && Number(product.quantity) <= Number(product.min_quantity)
      )
      .slice(0, 8),
    recentMovements: movementsResult.data || [],
    todaySales,
    todayPurchases,
    todayExpenses
  };
}

export async function listRows(table: string, limit = 100) {
  const supabase = supabaseOrNull();

  if (!supabase) {
    return [] as Array<Record<string, unknown>>;
  }

  const { data } = await supabase
    .from(table)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []) as Array<Record<string, unknown>>;
}

export async function getMovementsForStock() {
  return listRows("stock_movements", 100);
}

export async function getTrash() {
  const supabase = supabaseOrNull();

  if (!supabase) {
    return {
      products: [] as ProductRow[],
      categories: [] as CategoryRow[]
    };
  }

  const [products, categories] = await Promise.all([
    supabase
      .from("products")
      .select("*, categories(id,name)")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
    supabase
      .from("categories")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
  ]);

  return {
    products: (products.data || []) as ProductRow[],
    categories: (categories.data || []) as CategoryRow[]
  };
}

export async function getReportData({
  from,
  to,
  productId,
  categoryId,
  movementType
}: {
  from?: string;
  to?: string;
  productId?: string;
  categoryId?: string;
  movementType?: string;
}) {
  const supabase = supabaseOrNull();

  if (!supabase) {
    return {
      sales: [],
      purchases: [],
      expenses: [],
      money: [],
      stock: [],
      products: [],
      topProducts: [],
      lowStock: [],
      totals: {
        sales: 0,
        purchases: 0,
        expenses: 0,
        profit: 0,
        inventoryValue: 0
      }
    };
  }

  const fromIso = from ? new Date(from).toISOString() : undefined;
  const toIso = to ? new Date(`${to}T23:59:59`).toISOString() : undefined;

  const applyDates = <T extends { gte: (column: string, value: string) => T; lte: (column: string, value: string) => T }>(
    query: T
  ) => {
    let result = query;
    if (fromIso) {
      result = result.gte("created_at", fromIso);
    }
    if (toIso) {
      result = result.lte("created_at", toIso);
    }
    return result;
  };

  let salesQuery = applyDates(
    supabase
      .from("sales")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500)
  );
  let purchasesQuery = applyDates(
    supabase
      .from("purchases")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500)
  );
  const expensesQuery = applyDates(
    supabase
      .from("expenses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500)
  );
  let stockQuery = applyDates(
    supabase
      .from("stock_movements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500)
  );
  const moneyQuery = applyDates(
    supabase
      .from("money_movements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500)
  );

  if (productId) {
    salesQuery = salesQuery.eq("product_id", productId);
    purchasesQuery = purchasesQuery.eq("product_id", productId);
    stockQuery = stockQuery.eq("product_id", productId);
  }

  if (movementType) {
    stockQuery = stockQuery.eq("type", movementType);
  }

  const productsQuery = categoryId
    ? supabase
        .from("products")
        .select("*")
        .is("deleted_at", null)
        .eq("category_id", categoryId)
    : supabase.from("products").select("*").is("deleted_at", null);

  const [salesResult, purchasesResult, expensesResult, stockResult, moneyResult, productsResult] =
    await Promise.all([
      salesQuery,
      purchasesQuery,
      expensesQuery,
      stockQuery,
      moneyQuery,
      productsQuery
    ]);

  const sales = salesResult.data || [];
  const purchases = purchasesResult.data || [];
  const expenses = expensesResult.data || [];
  const stock = stockResult.data || [];
  const products = (productsResult.data || []) as ProductRow[];

  const topProductMap = new Map<
    string,
    { product_sku: string; product_name: string; quantity: number; total_amount: number }
  >();

  sales
    .filter((sale) => sale.status === "completed")
    .forEach((sale) => {
      const current = topProductMap.get(sale.product_id) || {
        product_sku: sale.product_sku,
        product_name: sale.product_name,
        quantity: 0,
        total_amount: 0
      };
      current.quantity += Number(sale.quantity || 0);
      current.total_amount += Number(sale.total_amount || 0);
      topProductMap.set(sale.product_id, current);
    });

  return {
    sales,
    purchases,
    expenses,
    money: moneyResult.data || [],
    stock,
    products,
    topProducts: Array.from(topProductMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10),
    lowStock: products.filter(
      (product) => Number(product.min_quantity) > 0 && Number(product.quantity) <= Number(product.min_quantity)
    ),
    totals: {
      sales: sales
        .filter((sale) => sale.status === "completed")
        .reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0),
      purchases: purchases
        .filter((purchase) => purchase.status === "completed")
        .reduce((sum, purchase) => sum + Number(purchase.total_amount || 0), 0),
      expenses: expenses
        .filter((expense) => expense.status === "completed")
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
      profit: sales
        .filter((sale) => sale.status === "completed")
        .reduce((sum, sale) => sum + Number(sale.profit || 0), 0),
      inventoryValue: products.reduce(
        (sum, product) => sum + Number(product.quantity) * Number(product.purchase_price),
        0
      )
    }
  };
}

export async function getReconciliationBalance() {
  const supabase = supabaseOrNull();
  if (!supabase) return [];

  const [productsRes, movementsRes] = await Promise.all([
    supabase.from("products").select("*").is("deleted_at", null),
    supabase.from("stock_movements").select("product_id, type, old_quantity, new_quantity")
  ]);

  const products = (productsRes.data || []) as ProductRow[];
  const movements = movementsRes.data || [];

  const balanceByProduct = new Map<string, any>();
  
  products.forEach(p => {
    balanceByProduct.set(p.id, {
      id: p.id,
      name: p.name,
      sku: p.sku,
      current_quantity: Number(p.quantity),
      purchase_price: Number(p.purchase_price),
      initial: 0,
      purchased: 0,
      sold: 0,
      other: 0,
      expected_quantity: 0
    });
  });

  movements.forEach(m => {
    const b = balanceByProduct.get(m.product_id);
    if (!b) return;
    
    const delta = Number(m.new_quantity) - Number(m.old_quantity);
    
    if (m.type === 'initial') {
      b.initial += delta;
    } else if (m.type === 'purchase') {
      b.purchased += delta;
    } else if (m.type === 'sale') {
      b.sold += Math.abs(delta);
    } else {
      b.other += delta;
    }
  });

  const result = Array.from(balanceByProduct.values()).map(b => {
    b.expected_quantity = b.initial + b.purchased - b.sold + b.other;
    b.difference = b.current_quantity - b.expected_quantity;
    return b;
  });

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

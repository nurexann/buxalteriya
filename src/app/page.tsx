import { Plus, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireUser();
  const data = await getDashboardData();

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Bugungi savdo, ombor va pul holati.</p>
        </div>
        <div className="row">
          <Link className="button" href="/products/new">
            <Plus size={18} />
            Tovar qo'shish
          </Link>
          <Link className="ghost-button" href="/sales">
            <ShoppingCart size={18} />
            Tez sotuv
          </Link>
        </div>
      </header>

      <section className="quick-actions">
        <Link className="quick-card product" href="/products/new">
          <div className="row">
            <div className="brand-mark">
              <Plus size={24} />
            </div>
            <div>
              <strong>Yangi tovar</strong>
              <p>Rasm, SKU, narx va boshlang'ich qoldiq bilan qo'shish</p>
            </div>
          </div>
        </Link>
        <Link className="quick-card sale" href="/sales">
          <div className="row">
            <div className="brand-mark">
              <ShoppingCart size={24} />
            </div>
            <div>
              <strong>Tez sotuv</strong>
              <p>SKU orqali topish, qoldiq va foydani avtomatik hisoblash</p>
            </div>
          </div>
        </Link>
      </section>

      {!data.setup.configured ? (
        <div className="notice">{data.setup.message}</div>
      ) : null}

      <section className="grid grid-4">
        <StatCard label="Jami tovarlar" value={formatNumber(data.productCount)} />
        <StatCard
          label="Ombor qiymati"
          value={formatCurrency(data.inventoryValue)}
          hint="Xarid narxi bo'yicha"
        />
        <StatCard
          label="Bugungi savdo"
          value={formatCurrency(data.todaySalesAmount)}
        />
        <StatCard label="Bugungi foyda" value={formatCurrency(data.todayProfit)} />
      </section>

      <section className="grid grid-3">
        <StatCard label="Umumiy balans" value={formatCurrency(data.moneyBalance)} />
        <StatCard
          label="Bugungi kirim"
          value={formatCurrency(data.todayPurchasesAmount)}
        />
        <StatCard
          label="Bugungi chiqim"
          value={formatCurrency(data.todayExpensesAmount)}
        />
      </section>

      <section className="grid grid-2">
        <div className="panel">
          <h2 className="section-title">Kam qolgan tovarlar</h2>
          {data.lowStock.length ? (
            <div className="stack">
              {data.lowStock.map((product) => (
                <Link className="item-card row-between" href="/products" key={product.id}>
                  <span>
                    <strong>{product.name}</strong>
                    <br />
                    <span className="muted">{product.sku}</span>
                  </span>
                  <span className="badge warning">
                    {formatNumber(product.quantity)} / {formatNumber(product.min_quantity)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState text="Kam qolgan tovar yo'q." />
          )}
        </div>

        <div className="panel">
          <h2 className="section-title">Oxirgi harakatlar</h2>
          {data.recentMovements.length ? (
            <div className="stack">
              {data.recentMovements.map((movement) => (
                <div className="item-card row-between" key={String(movement.id)}>
                  <span>
                    <strong>{String(movement.product_name)}</strong>
                    <br />
                    <span className="muted">
                      {String(movement.type)} - {formatDate(String(movement.created_at))}
                    </span>
                  </span>
                  <span className="badge">{formatNumber(Number(movement.quantity))}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Hali ombor harakati yo'q." />
          )}
        </div>
      </section>

      <section className="grid grid-3">
        <div className="panel">
          <h2 className="section-title">Bugungi sotuvlar</h2>
          <MiniList rows={data.todaySales} amountKey="total_amount" />
        </div>
        <div className="panel">
          <h2 className="section-title">Bugungi kirimlar</h2>
          <MiniList rows={data.todayPurchases} amountKey="total_amount" />
        </div>
        <div className="panel">
          <h2 className="section-title">Bugungi chiqimlar</h2>
          <MiniList rows={data.todayExpenses} amountKey="amount" titleKey="title" />
        </div>
      </section>
    </div>
  );
}

function MiniList({
  rows,
  amountKey,
  titleKey = "product_name"
}: {
  rows: Array<Record<string, unknown>>;
  amountKey: string;
  titleKey?: string;
}) {
  if (!rows.length) {
    return <EmptyState text="Bugun yozuv yo'q." />;
  }

  return (
    <div className="stack">
      {rows.slice(0, 5).map((row) => (
        <div className="row-between" key={String(row.id)}>
          <span>
            <strong>{String(row[titleKey] || "-")}</strong>
            <br />
            <span className="muted">{formatDate(String(row.created_at))}</span>
          </span>
          <span className="mono">{formatCurrency(Number(row[amountKey] || 0))}</span>
        </div>
      ))}
    </div>
  );
}


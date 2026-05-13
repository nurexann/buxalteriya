import { Download } from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getCategories, getProducts, getReportData } from "@/lib/data";
import { formatCurrency, formatDate, formatNumber, todayIsoDate } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    product?: string;
    category?: string;
    movement_type?: string;
  }>;
}) {
  await requireUser();
  const params = await searchParams;
  const [categories, products, report] = await Promise.all([
    getCategories(),
    getProducts({ limit: 500 }),
    getReportData({
      from: params.from || todayIsoDate(),
      to: params.to || todayIsoDate(),
      productId: params.product,
      categoryId: params.category,
      movementType: params.movement_type
    })
  ]);

  const from = params.from || todayIsoDate();
  const to = params.to || todayIsoDate();
  const csvQuery = new URLSearchParams({ from, to }).toString();

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1 className="page-title">Hisobotlar</h1>
          <p className="page-subtitle">Kunlik, haftalik, oylik va filterli ko'rinishlar.</p>
        </div>
        <Link className="ghost-button" href={`/api/reports/csv?type=sales&${csvQuery}`}>
          <Download size={18} />
          CSV
        </Link>
      </header>

      <form className="panel form-grid">
        <div className="field">
          <label htmlFor="from">Boshlanish</label>
          <input className="input" defaultValue={from} id="from" name="from" type="date" />
        </div>
        <div className="field">
          <label htmlFor="to">Tugash</label>
          <input className="input" defaultValue={to} id="to" name="to" type="date" />
        </div>
        <div className="field">
          <label htmlFor="product">Tovar</label>
          <select className="select" defaultValue={params.product || ""} id="product" name="product">
            <option value="">Barchasi</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.sku} · {product.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="category">Kategoriya</label>
          <select
            className="select"
            defaultValue={params.category || ""}
            id="category"
            name="category"
          >
            <option value="">Barchasi</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="movement_type">Movement type</label>
          <select
            className="select"
            defaultValue={params.movement_type || ""}
            id="movement_type"
            name="movement_type"
          >
            <option value="">Barchasi</option>
            <option value="initial">initial</option>
            <option value="purchase">purchase</option>
            <option value="sale">sale</option>
            <option value="manual_out">manual_out</option>
            <option value="return">return</option>
            <option value="adjustment">adjustment</option>
            <option value="trash_restore">trash_restore</option>
            <option value="correction">correction</option>
          </select>
        </div>
        <div className="field" style={{ alignSelf: "end" }}>
          <button className="button" type="submit">
            Ko'rish
          </button>
        </div>
      </form>

      <section className="grid grid-4">
        <StatCard label="Savdo" value={formatCurrency(report.totals.sales)} />
        <StatCard label="Kirim" value={formatCurrency(report.totals.purchases)} />
        <StatCard label="Chiqim" value={formatCurrency(report.totals.expenses)} />
        <StatCard label="Foyda" value={formatCurrency(report.totals.profit)} />
      </section>

      <section className="grid grid-3">
        <StatCard
          label="Ombor qiymati"
          value={formatCurrency(report.totals.inventoryValue)}
        />
        <StatCard
          label="Eng ko'p sotilgan"
          value={report.topProducts[0]?.product_sku || "-"}
          hint={
            report.topProducts[0]
              ? `${formatNumber(report.topProducts[0].quantity)} dona`
              : undefined
          }
        />
        <StatCard label="Kam qolganlar" value={formatNumber(report.lowStock.length)} />
      </section>

      <section className="grid grid-2">
        <div className="panel">
          <h2 className="section-title">Eng ko'p sotilgan tovarlar</h2>
          {report.topProducts.length ? (
            <div className="stack">
              {report.topProducts.map((product) => (
                <div className="row-between" key={product.product_sku}>
                  <span>
                    <strong>{product.product_name}</strong>
                    <br />
                    <span className="muted">{product.product_sku}</span>
                  </span>
                  <span className="badge">
                    {formatNumber(product.quantity)} · {formatCurrency(product.total_amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Bu oraliqda sotuv yo'q." />
          )}
        </div>

        <div className="panel">
          <h2 className="section-title">Kam qolgan tovarlar</h2>
          {report.lowStock.length ? (
            <div className="stack">
              {report.lowStock.map((product) => (
                <div className="row-between" key={product.id}>
                  <span>
                    <strong>{product.name}</strong>
                    <br />
                    <span className="muted">{product.sku}</span>
                  </span>
                  <span className="badge warning">
                    {formatNumber(product.quantity)} / {formatNumber(product.min_quantity)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Kam qoldiq yo'q." />
          )}
        </div>
      </section>

      <section className="table-wrap">
        <h2 className="section-title">Pul kirim-chiqim tarixi</h2>
        {report.money.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Sana</th>
                <th>Type</th>
                <th>Direction</th>
                <th>Summa</th>
                <th>Manba</th>
                <th>Izoh</th>
              </tr>
            </thead>
            <tbody>
              {report.money.map((row) => (
                <tr key={String(row.id)}>
                  <td>{formatDate(String(row.created_at))}</td>
                  <td>{String(row.type)}</td>
                  <td>
                    <span className={row.direction === "income" ? "badge success" : "badge danger"}>
                      {String(row.direction)}
                    </span>
                  </td>
                  <td className="mono">{formatCurrency(Number(row.amount))}</td>
                  <td>{String(row.source_type || "")}</td>
                  <td>{String(row.note || "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState text="Pul harakati topilmadi." />
        )}
      </section>

      <section className="table-wrap">
        <h2 className="section-title">Tovar harakatlari tarixi</h2>
        {report.stock.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Sana</th>
                <th>Tovar</th>
                <th>Type</th>
                <th>Soni</th>
                <th>Old</th>
                <th>New</th>
              </tr>
            </thead>
            <tbody>
              {report.stock.map((row) => (
                <tr key={String(row.id)}>
                  <td>{formatDate(String(row.created_at))}</td>
                  <td>
                    <strong>{String(row.product_name)}</strong>
                    <br />
                    <span className="muted">{String(row.product_sku)}</span>
                  </td>
                  <td>{String(row.type)}</td>
                  <td className="mono">{formatNumber(Number(row.quantity))}</td>
                  <td className="mono">{formatNumber(Number(row.old_quantity))}</td>
                  <td className="mono">{formatNumber(Number(row.new_quantity))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState text="Tovar harakati topilmadi." />
        )}
      </section>
    </div>
  );
}

import { requireUser } from "@/lib/auth/session";
import { getMovementsForStock, getProducts } from "@/lib/data";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { ManualStockForm } from "@/components/ManualStockForm";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  await requireUser();
  const [products, movements] = await Promise.all([
    getProducts({ limit: 500 }),
    getMovementsForStock()
  ]);

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1 className="page-title">Ombor</h1>
          <p className="page-subtitle">Qoldiq, kirim, sotuv, chiqim va tuzatish tarixi.</p>
        </div>
      </header>

      <section className="grid grid-2">
        <div>
          <h2 className="section-title">Qo'lda ombor harakati</h2>
          <ManualStockForm />
        </div>
        <div className="panel">
          <h2 className="section-title">Ombordagi tovarlar</h2>
          {products.length ? (
            <div className="stack">
              {products.slice(0, 12).map((product) => (
                <div className="row-between" key={product.id}>
                  <span>
                    <strong>{product.name}</strong>
                    <br />
                    <span className="muted">{product.sku}</span>
                  </span>
                  <span
                    className={
                      Number(product.min_quantity) > 0 &&
                      Number(product.quantity) <= Number(product.min_quantity)
                        ? "badge warning"
                        : "badge"
                    }
                  >
                    {formatNumber(product.quantity)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Omborda tovar yo'q." />
          )}
        </div>
      </section>

      <section className="table-wrap">
        <h2 className="section-title">Stock movement log</h2>
        {movements.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Sana</th>
                <th>Tovar</th>
                <th>Type</th>
                <th>Soni</th>
                <th>Old</th>
                <th>New</th>
                <th>Summa</th>
                <th>Sabab</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement) => (
                <tr key={String(movement.id)}>
                  <td>{formatDate(String(movement.created_at))}</td>
                  <td>
                    <strong>{String(movement.product_name)}</strong>
                    <br />
                    <span className="muted">{String(movement.product_sku)}</span>
                  </td>
                  <td>
                    <span className="badge">{String(movement.type)}</span>
                  </td>
                  <td className="mono">{formatNumber(Number(movement.quantity))}</td>
                  <td className="mono">{formatNumber(Number(movement.old_quantity))}</td>
                  <td className="mono">{formatNumber(Number(movement.new_quantity))}</td>
                  <td className="mono">{formatCurrency(Number(movement.total_amount))}</td>
                  <td>{String(movement.reason || "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState text="Hali stock movement yo'q." />
        )}
      </section>
    </div>
  );
}

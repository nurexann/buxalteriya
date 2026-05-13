import { requireUser } from "@/lib/auth/session";
import { listRows } from "@/lib/data";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { CancelSaleForm } from "@/components/InlineActionForms";
import { SaleForm } from "@/components/SaleForm";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  await requireUser();
  const sales = await listRows("sales", 100);

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1 className="page-title">Sotuv</h1>
          <p className="page-subtitle">SKU bilan tez qidirish, foyda va qoldiq nazorati.</p>
        </div>
      </header>

      <SaleForm />

      <section className="table-wrap">
        <h2 className="section-title">Sotuv tarixi</h2>
        {sales.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Sana</th>
                <th>Tovar</th>
                <th>Soni</th>
                <th>Narx</th>
                <th>Chegirma</th>
                <th>Jami</th>
                <th>Foyda</th>
                <th>Status</th>
                <th>Amal</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={String(sale.id)}>
                  <td>{formatDate(String(sale.created_at))}</td>
                  <td>
                    <strong>{String(sale.product_name)}</strong>
                    <br />
                    <span className="muted">{String(sale.product_sku)}</span>
                  </td>
                  <td className="mono">{formatNumber(Number(sale.quantity))}</td>
                  <td className="mono">{formatCurrency(Number(sale.unit_price))}</td>
                  <td className="mono">{formatCurrency(Number(sale.discount))}</td>
                  <td className="mono">{formatCurrency(Number(sale.total_amount))}</td>
                  <td className="mono">{formatCurrency(Number(sale.profit))}</td>
                  <td>
                    <span className={sale.status === "completed" ? "badge success" : "badge danger"}>
                      {String(sale.status)}
                    </span>
                  </td>
                  <td>
                    {sale.status === "completed" ? (
                      <CancelSaleForm saleId={String(sale.id)} />
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState text="Hali sotuv yozilmagan." />
        )}
      </section>
    </div>
  );
}

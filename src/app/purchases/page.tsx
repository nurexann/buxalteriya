import { requireUser } from "@/lib/auth/session";
import { listRows } from "@/lib/data";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { CancelPurchaseForm } from "@/components/InlineActionForms";
import { PurchaseForm } from "@/components/PurchaseForm";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  await requireUser();
  const purchases = await listRows("purchases", 100);

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1 className="page-title">Kirim</h1>
          <p className="page-subtitle">Omborga kelgan tovar va pul chiqimi bir transaction’da yoziladi.</p>
        </div>
      </header>

      <PurchaseForm />

      <section className="table-wrap">
        <h2 className="section-title">Kirim tarixi</h2>
        {purchases.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Sana</th>
                <th>Tovar</th>
                <th>Soni</th>
                <th>Narx</th>
                <th>Jami</th>
                <th>Status</th>
                <th>Amal</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={String(purchase.id)}>
                  <td>{formatDate(String(purchase.created_at))}</td>
                  <td>
                    <strong>{String(purchase.product_name)}</strong>
                    <br />
                    <span className="muted">{String(purchase.product_sku)}</span>
                  </td>
                  <td className="mono">{formatNumber(Number(purchase.quantity))}</td>
                  <td className="mono">{formatCurrency(Number(purchase.unit_price))}</td>
                  <td className="mono">{formatCurrency(Number(purchase.total_amount))}</td>
                  <td>
                    <span className={purchase.status === "completed" ? "badge success" : "badge danger"}>
                      {String(purchase.status)}
                    </span>
                  </td>
                  <td>
                    {purchase.status === "completed" ? (
                      <CancelPurchaseForm purchaseId={String(purchase.id)} />
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState text="Hali kirim yozilmagan." />
        )}
      </section>
    </div>
  );
}

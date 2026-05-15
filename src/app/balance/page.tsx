import { requireUser } from "@/lib/auth/session";
import { getReconciliationBalance } from "@/lib/data";
import { formatCurrency, formatNumber } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function BalancePage() {
  await requireUser();
  const balanceData = await getReconciliationBalance();

  const totalExpectedValue = balanceData.reduce(
    (sum, b) => sum + b.expected_quantity * b.purchase_price,
    0
  );
  
  const totalActualValue = balanceData.reduce(
    (sum, b) => sum + b.current_quantity * b.purchase_price,
    0
  );

  const totalDifference = balanceData.reduce(
    (sum, b) => sum + Math.abs(b.difference),
    0
  );

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1 className="page-title">Balans (Taqqoslash)</h1>
          <p className="page-subtitle">Kirim, chiqim va joriy ombor qoldig'ini taqqoslash.</p>
        </div>
      </header>

      <section className="grid grid-3">
        <div className="stat-card panel">
          <div className="stat-label">Kutilayotgan Ombor Qiymati</div>
          <div className="stat-value">{formatCurrency(totalExpectedValue)}</div>
        </div>
        <div className="stat-card panel">
          <div className="stat-label">Haqiqiy Ombor Qiymati</div>
          <div className="stat-value">{formatCurrency(totalActualValue)}</div>
        </div>
        <div className="stat-card panel" style={{ borderColor: totalDifference > 0 ? "var(--danger)" : undefined }}>
          <div className="stat-label">Tafovut (Soni bo'yicha)</div>
          <div className="stat-value" style={{ color: totalDifference > 0 ? "var(--danger)" : "var(--success)" }}>
            {totalDifference > 0 ? `${formatNumber(totalDifference)} xatolik` : "Hammasi joyida"}
          </div>
        </div>
      </section>

      <section className="table-wrap">
        <h2 className="section-title">Tovar bo'yicha hisobot</h2>
        {balanceData.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Tovar</th>
                <th>Boshlang'ich</th>
                <th>Sotib olingan</th>
                <th>Sotilgan</th>
                <th>Boshqa</th>
                <th>Kutilgan Qoldiq</th>
                <th>Haqiqiy Qoldiq</th>
                <th>Farq</th>
              </tr>
            </thead>
            <tbody>
              {balanceData.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.name}</strong>
                    <br />
                    <span className="muted">{row.sku}</span>
                  </td>
                  <td className="mono">{formatNumber(row.initial)}</td>
                  <td className="mono" style={{ color: 'var(--success)' }}>+{formatNumber(row.purchased)}</td>
                  <td className="mono" style={{ color: 'var(--blue)' }}>-{formatNumber(row.sold)}</td>
                  <td className="mono">{formatNumber(row.other)}</td>
                  <td className="mono" style={{ fontWeight: 600 }}>{formatNumber(row.expected_quantity)}</td>
                  <td className="mono" style={{ fontWeight: 600 }}>{formatNumber(row.current_quantity)}</td>
                  <td>
                    {row.difference === 0 ? (
                      <span className="badge success">Joyida</span>
                    ) : (
                      <span className="badge danger">{formatNumber(row.difference)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState text="Tovarlar topilmadi." />
        )}
      </section>
    </div>
  );
}

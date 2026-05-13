import { requireUser } from "@/lib/auth/session";
import { listRows } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { ExpenseForm } from "@/components/ExpenseForm";
import { CancelExpenseForm } from "@/components/InlineActionForms";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  await requireUser();
  const expenses = await listRows("expenses", 100);

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1 className="page-title">Chiqim / Xarajatlar</h1>
          <p className="page-subtitle">Tovardan tashqari pul chiqimlari.</p>
        </div>
      </header>

      <ExpenseForm />

      <section className="table-wrap">
        <h2 className="section-title">Xarajat tarixi</h2>
        {expenses.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Sana</th>
                <th>Nomi</th>
                <th>Kategoriya</th>
                <th>Summa</th>
                <th>Status</th>
                <th>Amal</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={String(expense.id)}>
                  <td>{formatDate(String(expense.created_at))}</td>
                  <td>{String(expense.title)}</td>
                  <td>{String(expense.category)}</td>
                  <td className="mono">{formatCurrency(Number(expense.amount))}</td>
                  <td>
                    <span className={expense.status === "completed" ? "badge success" : "badge danger"}>
                      {String(expense.status)}
                    </span>
                  </td>
                  <td>
                    {expense.status === "completed" ? (
                      <CancelExpenseForm expenseId={String(expense.id)} />
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState text="Hali xarajat yozilmagan." />
        )}
      </section>
    </div>
  );
}

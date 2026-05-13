import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { softDeleteCategoryAction } from "@/app/actions/products";
import { CategoryForm } from "@/components/CategoryForm";
import { requireUser } from "@/lib/auth/session";
import { getCategories, listRows, setupState } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const [categories, auditLogs] = await Promise.all([
    getCategories(),
    listRows("audit_logs", 30)
  ]);

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1 className="page-title">Sozlamalar</h1>
          <p className="page-subtitle">Owner, kategoriya, backup va audit.</p>
        </div>
        <form action={logoutAction}>
          <button className="ghost-button" type="submit">
            <LogOut size={18} />
            Chiqish
          </button>
        </form>
      </header>

      {!setupState.configured ? <div className="notice">{setupState.message}</div> : null}

      <section className="grid grid-2">
        <div className="panel">
          <h2 className="section-title">Owner</h2>
          <p>
            <strong>{user.name}</strong>
            <br />
            <span className="muted">{user.id}</span>
          </p>
          <p className="muted">
            Telegram auth TELEGRAM_ADMIN_ID bilan cheklanadi. Browser login esa
            OWNER_PASSWORD orqali ishlaydi.
          </p>
        </div>

        <div className="panel">
          <h2 className="section-title">Backup qoidasi</h2>
          <p className="muted">
            Supabase PITR yoki daily backup yoqing. Muhim jadvallar fizik
            o'chirilmaydi, rasmlar product permanent delete bo'lmaguncha saqlanadi.
          </p>
        </div>
      </section>

      <section className="grid grid-2">
        <div>
          <h2 className="section-title">Kategoriya qo'shish</h2>
          <CategoryForm />
        </div>
        <div className="panel">
          <h2 className="section-title">Kategoriyalar</h2>
          <div className="stack">
            {categories.map((category) => (
              <div className="row-between" key={category.id}>
                <span>{category.name}</span>
                <form action={softDeleteCategoryAction}>
                  <input name="category_id" type="hidden" value={category.id} />
                  <input
                    name="delete_reason"
                    type="hidden"
                    value="Kategoriya korzinkaga o'tkazildi."
                  />
                  <button className="danger-button" type="submit">
                    Korzinka
                  </button>
                </form>
              </div>
            ))}
            {!categories.length ? <p className="muted">Kategoriya yo'q.</p> : null}
          </div>
        </div>
      </section>

      <section className="table-wrap">
        <h2 className="section-title">Audit log</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Sana</th>
              <th>Action</th>
              <th>Entity</th>
              <th>User</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log) => (
              <tr key={String(log.id)}>
                <td>{formatDate(String(log.created_at))}</td>
                <td>{String(log.action)}</td>
                <td>{String(log.entity_type)}</td>
                <td>{String(log.user_id || "")}</td>
                <td>{String(log.note || "")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

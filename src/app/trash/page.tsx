import { requireUser } from "@/lib/auth/session";
import { daysUntilPurge } from "@/lib/business/calculations";
import { getTrash } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import {
  CategoryTrashActions,
  ProductTrashActions
} from "@/components/TrashActionForms";

export const dynamic = "force-dynamic";

export default async function TrashPage() {
  await requireUser();
  const trash = await getTrash();
  const rows = [
    ...trash.products.map((product) => ({
      id: product.id,
      type: "product" as const,
      name: product.name,
      deleted_at: product.deleted_at,
      reason: product.delete_reason
    })),
    ...trash.categories.map((category) => ({
      id: category.id,
      type: "category" as const,
      name: category.name,
      deleted_at: category.deleted_at,
      reason: category.delete_reason
    }))
  ].sort((a, b) => {
    return (
      new Date(b.deleted_at || 0).getTime() - new Date(a.deleted_at || 0).getTime()
    );
  });

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1 className="page-title">Korzinka</h1>
          <p className="page-subtitle">Oddiy entitylar 3 kundan keyin purge qilinadi.</p>
        </div>
      </header>

      <div className="notice">
        Sotuv, kirim, stock movement, pul movement, xarajat va audit log fizik
        o'chirilmaydi. Ular faqat cancelled, reversed yoki archived holatiga o'tadi.
      </div>

      {rows.length ? (
        <section className="grid grid-2">
          {rows.map((row) => (
            <article className="item-card stack" key={`${row.type}-${row.id}`}>
              <div className="row-between">
                <div>
                  <span className="badge">{row.type}</span>
                  <h2 className="item-title" style={{ marginTop: 8 }}>
                    {row.name}
                  </h2>
                  <p className="muted" style={{ margin: "4px 0 0" }}>
                    O'chirilgan: {formatDate(row.deleted_at)}
                  </p>
                  <p className="muted" style={{ margin: "4px 0 0" }}>
                    Purge: {daysUntilPurge(new Date(row.deleted_at || Date.now()))} kun
                  </p>
                  {row.reason ? (
                    <p className="muted" style={{ margin: "4px 0 0" }}>
                      Sabab: {row.reason}
                    </p>
                  ) : null}
                </div>
              </div>
              {row.type === "product" ? (
                <ProductTrashActions productId={row.id} />
              ) : (
                <CategoryTrashActions categoryId={row.id} />
              )}
            </article>
          ))}
        </section>
      ) : (
        <EmptyState text="Korzinka bo'sh." />
      )}
    </div>
  );
}

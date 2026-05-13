import { Edit3, Plus, Search } from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getCategories, getProducts } from "@/lib/data";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { SoftDeleteProductForm } from "@/components/InlineActionForms";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; category?: string; low?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({
      search: params.q,
      categoryId: params.category,
      lowStock: params.low === "1"
    })
  ]);

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1 className="page-title">Tovarlar</h1>
          <p className="page-subtitle">SKU, narx, qoldiq va rasm bilan tovar kartalari.</p>
        </div>
        <Link className="button" href="/products/new">
          <Plus size={18} />
          Tovar qo'shish
        </Link>
      </header>

      <form className="panel form-grid">
        <div className="field">
          <label htmlFor="q">Qidiruv</label>
          <div style={{ position: "relative" }}>
            <Search
              aria-hidden="true"
              style={{
                color: "var(--muted)",
                height: 18,
                left: 12,
                position: "absolute",
                top: 13,
                width: 18
              }}
            />
            <input
              className="input"
              defaultValue={params.q || ""}
              id="q"
              name="q"
              placeholder="SKU yoki nom"
              style={{ paddingLeft: 38 }}
            />
          </div>
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
          <label htmlFor="low">Kam qolgan</label>
          <select className="select" defaultValue={params.low || ""} id="low" name="low">
            <option value="">Barchasi</option>
            <option value="1">Faqat kam qolganlar</option>
          </select>
        </div>
        <div className="field" style={{ alignSelf: "end" }}>
          <button className="button" type="submit">
            <Search size={18} />
            Qidirish
          </button>
        </div>
      </form>

      {products.length ? (
        <section className="grid grid-2">
          {products.map((product) => {
            const low =
              Number(product.min_quantity) > 0 &&
              Number(product.quantity) <= Number(product.min_quantity);
            const estimatedProfit =
              Number(product.sale_price) - Number(product.purchase_price);

            return (
              <article className="item-card product-card" key={product.id}>
                {product.image_url ? (
                  <img alt="" className="product-image" src={product.image_url} />
                ) : (
                  <span className="image-placeholder">{product.name.slice(0, 2)}</span>
                )}
                <div className="stack">
                  <div className="row-between">
                    <div>
                      <h2 className="item-title">{product.name}</h2>
                      <span className="muted">{product.sku}</span>
                    </div>
                    {low ? <span className="badge warning">Kam</span> : null}
                  </div>
                  <div className="grid grid-3">
                    <span>
                      <span className="meta-label">Qoldiq</span>
                      <br />
                      <strong className="mono">{formatNumber(product.quantity)}</strong>
                    </span>
                    <span>
                      <span className="meta-label">Xarid</span>
                      <br />
                      <strong className="mono">{formatCurrency(product.purchase_price)}</strong>
                    </span>
                    <span>
                      <span className="meta-label">Sotuv</span>
                      <br />
                      <strong className="mono">{formatCurrency(product.sale_price)}</strong>
                    </span>
                  </div>
                  <div className="row">
                    <span className="badge success">
                      Taxminiy foyda: {formatCurrency(estimatedProfit)}
                    </span>
                    <span className="badge">
                      Oxirgi: {formatDate(product.updated_at)}
                    </span>
                    {product.categories?.name ? (
                      <span className="badge">{product.categories.name}</span>
                    ) : null}
                  </div>
                  <div className="row">
                    <Link className="ghost-button" href={`/products/${product.id}/edit`}>
                      <Edit3 size={18} />
                      Tahrirlash
                    </Link>
                    <SoftDeleteProductForm productId={product.id} />
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <EmptyState text="Tovar topilmadi. Yangi tovar qo'shing yoki filterlarni o'zgartiring." />
      )}
    </div>
  );
}

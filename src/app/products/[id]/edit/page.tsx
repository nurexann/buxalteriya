import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductForm } from "@/components/ProductForm";
import { requireUser } from "@/lib/auth/session";
import { getCategories, getProduct } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const [product, categories] = await Promise.all([getProduct(id), getCategories()]);

  if (!product) {
    notFound();
  }

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1 className="page-title">Tovarni tahrirlash</h1>
          <p className="page-subtitle">{product.sku}</p>
        </div>
        <Link className="ghost-button" href="/products">
          Orqaga
        </Link>
      </header>
      <ProductForm categories={categories} product={product} />
    </div>
  );
}

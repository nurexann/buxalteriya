import Link from "next/link";
import { ProductForm } from "@/components/ProductForm";
import { requireUser } from "@/lib/auth/session";
import { getCategories } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireUser();
  const categories = await getCategories();

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1 className="page-title">Tovar qo'shish</h1>
          <p className="page-subtitle">
            Rasm yuklang, nom va SKU kiriting, narx hamda boshlang'ich qoldiqni to'ldiring.
            SKU unique bo'lishi shart.
          </p>
        </div>
        <Link className="ghost-button" href="/products">
          Orqaga
        </Link>
      </header>
      <ProductForm categories={categories} />
    </div>
  );
}

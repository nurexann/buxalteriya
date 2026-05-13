"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatNumber } from "@/lib/format";

export type PickerProduct = {
  id: string;
  name: string;
  sku: string;
  image_url: string | null;
  purchase_price: number;
  sale_price: number;
  quantity: number;
  min_quantity: number;
  category_id: string | null;
};

export function ProductPicker({
  selectedProduct,
  onSelect
}: {
  selectedProduct?: PickerProduct | null;
  onSelect?: (product: PickerProduct) => void;
}) {
  const [query, setQuery] = useState(selectedProduct?.sku || "");
  const [products, setProducts] = useState<PickerProduct[]>([]);
  const [selected, setSelected] = useState<PickerProduct | null>(
    selectedProduct || null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/products/search?q=${encodeURIComponent(query)}`,
          {
            signal: controller.signal
          }
        );
        const json = (await response.json()) as { products?: PickerProduct[] };
        setProducts(json.products || []);
      } catch {
        if (!controller.signal.aborted) {
          setProducts([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const resultLabel = useMemo(() => {
    if (loading) {
      return "Qidirilmoqda...";
    }

    if (!products.length && query) {
      return "Tovar topilmadi";
    }

    return "";
  }, [loading, products.length, query]);

  return (
    <div className="field full">
      <label htmlFor="product-search">Tovar / SKU</label>
      <input name="product_id" type="hidden" value={selected?.id || ""} />
      <div className="row">
        <div style={{ flex: "1 1 260px", position: "relative" }}>
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
            id="product-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="SKU yoki nom yozing"
            style={{ paddingLeft: 38 }}
            value={query}
          />
        </div>
        {selected ? (
          <span className="badge success">
            {selected.sku} · {formatNumber(selected.quantity)} dona
          </span>
        ) : null}
      </div>

      <div className="search-results">
        {products.map((product) => (
          <button
            className={`search-result ${selected?.id === product.id ? "selected" : ""}`}
            key={product.id}
            onClick={() => {
              setSelected(product);
              setQuery(product.sku);
              onSelect?.(product);
            }}
            type="button"
          >
            <span>
              <strong>{product.name}</strong>
              <br />
              <span className="muted">{product.sku}</span>
            </span>
            <span className="muted mono">
              {formatNumber(product.quantity)} dona · {formatCurrency(product.sale_price)}
            </span>
          </button>
        ))}
        {resultLabel ? <span className="muted">{resultLabel}</span> : null}
      </div>
    </div>
  );
}

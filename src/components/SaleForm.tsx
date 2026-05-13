"use client";

import { ShoppingCart } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { createSaleAction } from "@/app/actions/sales";
import { ActionAlert } from "@/components/ActionAlert";
import { ProductPicker, type PickerProduct } from "@/components/ProductPicker";
import { SubmitButton } from "@/components/SubmitButton";
import { calculateSaleTotals } from "@/lib/business/calculations";
import { initialActionState } from "@/lib/errors";
import { formatCurrency, todayIsoDate } from "@/lib/format";

export function SaleForm() {
  const [state, formAction] = useActionState(createSaleAction, initialActionState);
  const [product, setProduct] = useState<PickerProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [discount, setDiscount] = useState(0);

  const totals = useMemo(() => {
    return calculateSaleTotals({
      purchasePrice: product?.purchase_price || 0,
      salePrice: unitPrice,
      quantity,
      discount
    });
  }, [discount, product?.purchase_price, quantity, unitPrice]);

  return (
    <form action={formAction} className="form-card stack">
      <ActionAlert state={state} />
      <ProductPicker
        onSelect={(item) => {
          setProduct(item);
          setUnitPrice(Number(item.sale_price || 0));
        }}
        selectedProduct={product}
      />

      <div className="form-grid">
        <div className="field">
          <label htmlFor="quantity">Soni</label>
          <input
            className="input"
            id="quantity"
            min="0.001"
            name="quantity"
            onChange={(event) => setQuantity(Number(event.target.value || 0))}
            step="0.001"
            type="number"
            value={quantity}
          />
        </div>
        <div className="field">
          <label htmlFor="unit_price">Sotuv narxi</label>
          <input
            className="input"
            id="unit_price"
            min="0"
            name="unit_price"
            onChange={(event) => setUnitPrice(Number(event.target.value || 0))}
            step="0.01"
            type="number"
            value={unitPrice}
          />
        </div>
        <div className="field">
          <label htmlFor="discount">Chegirma</label>
          <input
            className="input"
            id="discount"
            min="0"
            name="discount"
            onChange={(event) => setDiscount(Number(event.target.value || 0))}
            step="0.01"
            type="number"
            value={discount}
          />
        </div>
        <div className="field">
          <label htmlFor="created_at">Sana</label>
          <input
            className="input"
            defaultValue={todayIsoDate()}
            id="created_at"
            name="created_at"
            type="date"
          />
        </div>
        <div className="field full">
          <label htmlFor="note">Izoh</label>
          <textarea className="textarea" id="note" name="note" />
        </div>
      </div>

      <div className="row">
        <span className="badge">Jami: {formatCurrency(totals.totalAmount)}</span>
        <span className={totals.profit >= 0 ? "badge success" : "badge danger"}>
          Foyda: {formatCurrency(totals.profit)}
        </span>
      </div>

      <SubmitButton>
        <ShoppingCart />
        Sotuv yozish
      </SubmitButton>
    </form>
  );
}

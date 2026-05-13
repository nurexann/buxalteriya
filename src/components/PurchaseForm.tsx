"use client";

import { ClipboardPlus } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { createPurchaseAction } from "@/app/actions/purchases";
import { ActionAlert } from "@/components/ActionAlert";
import { ProductPicker, type PickerProduct } from "@/components/ProductPicker";
import { SubmitButton } from "@/components/SubmitButton";
import { initialActionState } from "@/lib/errors";
import { formatCurrency, todayIsoDate } from "@/lib/format";

export function PurchaseForm() {
  const [state, formAction] = useActionState(
    createPurchaseAction,
    initialActionState
  );
  const [product, setProduct] = useState<PickerProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const total = useMemo(() => quantity * unitPrice, [quantity, unitPrice]);

  return (
    <form action={formAction} className="form-card stack">
      <ActionAlert state={state} />
      <ProductPicker
        onSelect={(item) => {
          setProduct(item);
          setUnitPrice(Number(item.purchase_price || 0));
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
          <label htmlFor="unit_price">Xarid narxi</label>
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

      <span className="badge">Jami xarid: {formatCurrency(total)}</span>

      <SubmitButton>
        <ClipboardPlus />
        Kirim qilish
      </SubmitButton>
    </form>
  );
}

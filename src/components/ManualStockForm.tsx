"use client";

import { Boxes } from "lucide-react";
import { useActionState, useState } from "react";
import { createManualStockMovementAction } from "@/app/actions/stock";
import { ActionAlert } from "@/components/ActionAlert";
import { ProductPicker, type PickerProduct } from "@/components/ProductPicker";
import { SubmitButton } from "@/components/SubmitButton";
import { initialActionState } from "@/lib/errors";

export function ManualStockForm() {
  const [state, formAction] = useActionState(
    createManualStockMovementAction,
    initialActionState
  );
  const [product, setProduct] = useState<PickerProduct | null>(null);

  return (
    <form action={formAction} className="form-card stack">
      <ActionAlert state={state} />
      <ProductPicker onSelect={setProduct} selectedProduct={product} />
      <div className="form-grid">
        <div className="field">
          <label htmlFor="type">Harakat turi</label>
          <select className="select" defaultValue="manual_out" id="type" name="type">
            <option value="manual_out">Chiqib ketdi / zarar</option>
            <option value="return">Qaytdi</option>
            <option value="adjustment">Tuzatish</option>
            <option value="correction">Correction</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="quantity">Soni</label>
          <input
            className="input"
            id="quantity"
            name="quantity"
            step="0.001"
            type="number"
          />
        </div>
        <div className="field">
          <label htmlFor="unit_price">Narx</label>
          <input
            className="input"
            defaultValue={product?.purchase_price || 0}
            id="unit_price"
            min="0"
            name="unit_price"
            step="0.01"
            type="number"
          />
        </div>
        <div className="field full">
          <label htmlFor="reason">Sabab</label>
          <textarea className="textarea" id="reason" name="reason" required />
        </div>
      </div>
      <SubmitButton>
        <Boxes />
        Omborni yangilash
      </SubmitButton>
    </form>
  );
}

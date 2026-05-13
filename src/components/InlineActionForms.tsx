"use client";

import { ArchiveRestore, Ban, Trash2 } from "lucide-react";
import { useActionState } from "react";
import { softDeleteProductAction } from "@/app/actions/products";
import { cancelExpenseAction } from "@/app/actions/expenses";
import { cancelPurchaseAction } from "@/app/actions/purchases";
import { cancelSaleAction } from "@/app/actions/sales";
import { ActionAlert } from "@/components/ActionAlert";
import { SubmitButton } from "@/components/SubmitButton";
import { initialActionState } from "@/lib/errors";

export function SoftDeleteProductForm({ productId }: { productId: string }) {
  const [state, formAction] = useActionState(
    softDeleteProductAction,
    initialActionState
  );

  return (
    <form action={formAction} className="stack">
      <input name="product_id" type="hidden" value={productId} />
      <input
        name="delete_reason"
        type="hidden"
        value="Bu tovar korzinkaga o'tkaziladi. 3 kundan keyin butunlay o'chadi."
      />
      <ActionAlert state={state} />
      <SubmitButton className="danger-button">
        <Trash2 />
        Korzinkaga
      </SubmitButton>
    </form>
  );
}

export function CancelSaleForm({ saleId }: { saleId: string }) {
  const [state, formAction] = useActionState(cancelSaleAction, initialActionState);

  return (
    <form action={formAction} className="row">
      <input name="sale_id" type="hidden" value={saleId} />
      <input name="cancel_reason" type="hidden" value="Sotuv bekor qilindi." />
      <ActionAlert state={state} />
      <SubmitButton className="danger-button">
        <Ban />
        Bekor
      </SubmitButton>
    </form>
  );
}

export function CancelPurchaseForm({ purchaseId }: { purchaseId: string }) {
  const [state, formAction] = useActionState(
    cancelPurchaseAction,
    initialActionState
  );

  return (
    <form action={formAction} className="row">
      <input name="purchase_id" type="hidden" value={purchaseId} />
      <input name="cancel_reason" type="hidden" value="Kirim bekor qilindi." />
      <ActionAlert state={state} />
      <SubmitButton className="danger-button">
        <ArchiveRestore />
        Bekor
      </SubmitButton>
    </form>
  );
}

export function CancelExpenseForm({ expenseId }: { expenseId: string }) {
  const [state, formAction] = useActionState(
    cancelExpenseAction,
    initialActionState
  );

  return (
    <form action={formAction} className="row">
      <input name="expense_id" type="hidden" value={expenseId} />
      <input name="cancel_reason" type="hidden" value="Xarajat bekor qilindi." />
      <ActionAlert state={state} />
      <SubmitButton className="danger-button">
        <Ban />
        Bekor
      </SubmitButton>
    </form>
  );
}

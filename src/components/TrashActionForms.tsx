"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import { useActionState } from "react";
import {
  permanentDeleteProductAction,
  restoreProductAction
} from "@/app/actions/products";
import {
  permanentDeleteCategoryAction,
  restoreCategoryAction
} from "@/app/actions/trash";
import { ActionAlert } from "@/components/ActionAlert";
import { SubmitButton } from "@/components/SubmitButton";
import { initialActionState } from "@/lib/errors";

export function ProductTrashActions({ productId }: { productId: string }) {
  const [restoreState, restoreAction] = useActionState(
    restoreProductAction,
    initialActionState
  );
  const [deleteState, deleteAction] = useActionState(
    permanentDeleteProductAction,
    initialActionState
  );

  return (
    <div className="stack">
      <form action={restoreAction} className="row">
        <input name="product_id" type="hidden" value={productId} />
        <ActionAlert state={restoreState} />
        <SubmitButton className="success-button">
          <RotateCcw />
          Restore
        </SubmitButton>
      </form>
      <form action={deleteAction} className="row">
        <input name="product_id" type="hidden" value={productId} />
        <ActionAlert state={deleteState} />
        <SubmitButton className="danger-button">
          <Trash2 />
          Permanent
        </SubmitButton>
      </form>
    </div>
  );
}

export function CategoryTrashActions({ categoryId }: { categoryId: string }) {
  const [restoreState, restoreAction] = useActionState(
    restoreCategoryAction,
    initialActionState
  );
  const [deleteState, deleteAction] = useActionState(
    permanentDeleteCategoryAction,
    initialActionState
  );

  return (
    <div className="stack">
      <form action={restoreAction} className="row">
        <input name="category_id" type="hidden" value={categoryId} />
        <ActionAlert state={restoreState} />
        <SubmitButton className="success-button">
          <RotateCcw />
          Restore
        </SubmitButton>
      </form>
      <form action={deleteAction} className="row">
        <input name="category_id" type="hidden" value={categoryId} />
        <ActionAlert state={deleteState} />
        <SubmitButton className="danger-button">
          <Trash2 />
          Permanent
        </SubmitButton>
      </form>
    </div>
  );
}

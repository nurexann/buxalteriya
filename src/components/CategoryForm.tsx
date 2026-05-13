"use client";

import { FolderPlus } from "lucide-react";
import { useActionState } from "react";
import { createCategoryAction } from "@/app/actions/products";
import { ActionAlert } from "@/components/ActionAlert";
import { SubmitButton } from "@/components/SubmitButton";
import { initialActionState } from "@/lib/errors";

export function CategoryForm() {
  const [state, formAction] = useActionState(
    createCategoryAction,
    initialActionState
  );

  return (
    <form action={formAction} className="form-card stack">
      <ActionAlert state={state} />
      <div className="field">
        <label htmlFor="name">Kategoriya nomi</label>
        <input className="input" id="name" name="name" required />
      </div>
      <SubmitButton>
        <FolderPlus />
        Kategoriya qo'shish
      </SubmitButton>
    </form>
  );
}

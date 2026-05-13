"use client";

import { WalletCards } from "lucide-react";
import { useActionState } from "react";
import { createExpenseAction } from "@/app/actions/expenses";
import { ActionAlert } from "@/components/ActionAlert";
import { SubmitButton } from "@/components/SubmitButton";
import { initialActionState } from "@/lib/errors";
import { todayIsoDate } from "@/lib/format";

export function ExpenseForm() {
  const [state, formAction] = useActionState(createExpenseAction, initialActionState);

  return (
    <form action={formAction} className="form-card stack">
      <ActionAlert state={state} />
      <div className="form-grid">
        <div className="field">
          <label htmlFor="title">Xarajat nomi</label>
          <input className="input" id="title" name="title" required />
        </div>
        <div className="field">
          <label htmlFor="category">Kategoriya</label>
          <select className="select" defaultValue="boshqa" id="category" name="category">
            <option value="yol">Yo'l xarajati</option>
            <option value="reklama">Reklama</option>
            <option value="ijara">Ijara</option>
            <option value="qadoqlash">Qadoqlash</option>
            <option value="yetkazib_berish">Yetkazib berish</option>
            <option value="boshqa">Boshqa</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="amount">Summa</label>
          <input
            className="input"
            id="amount"
            min="0.01"
            name="amount"
            step="0.01"
            type="number"
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
      <SubmitButton>
        <WalletCards />
        Xarajat qo'shish
      </SubmitButton>
    </form>
  );
}

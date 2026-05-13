"use client";

import { LockKeyhole } from "lucide-react";
import { useActionState } from "react";
import { loginOwnerAction } from "@/app/actions/auth";
import { ActionAlert } from "@/components/ActionAlert";
import { SubmitButton } from "@/components/SubmitButton";
import { initialActionState } from "@/lib/errors";

export default function LoginPage() {
  const [state, formAction] = useActionState(loginOwnerAction, initialActionState);

  return (
    <main className="login-page">
      <form action={formAction} className="form-card login-card stack">
        <div>
          <div className="brand" style={{ marginBottom: 14 }}>
            <span className="brand-mark">
              <LockKeyhole size={18} />
            </span>
            <span>Shaxsiy Ombor</span>
          </div>
          <h1 className="page-title">Owner login</h1>
          <p className="page-subtitle">
            Browser uchun oddiy parol. Telegram ichida Mini App avtomatik kiradi.
          </p>
        </div>
        <ActionAlert state={state} />
        <div className="field">
          <label htmlFor="password">Parol</label>
          <input
            autoComplete="current-password"
            className="input"
            id="password"
            name="password"
            required
            type="password"
          />
        </div>
        <SubmitButton>
          <LockKeyhole />
          Kirish
        </SubmitButton>
        <p className="muted" style={{ margin: 0 }}>
          Local dev uchun default parol: owner. Production’da OWNER_PASSWORD sozlang.
        </p>
      </form>
    </main>
  );
}

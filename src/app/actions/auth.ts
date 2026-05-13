"use server";

import { redirect } from "next/navigation";
import { clearSession, getDevOwnerPassword, setSession } from "@/lib/auth/session";
import type { ActionState } from "@/lib/errors";
import { formText } from "@/lib/form";

export async function loginOwnerAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const password = formText(formData, "password");
  const ownerPassword = getDevOwnerPassword();

  if (!ownerPassword) {
    return {
      error: "OWNER_PASSWORD .env faylida sozlanmagan."
    };
  }

  if (password !== ownerPassword) {
    return {
      error: "Parol noto'g'ri."
    };
  }

  await setSession({
    id: "owner",
    kind: "owner",
    name: "Owner"
  });

  redirect("/");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

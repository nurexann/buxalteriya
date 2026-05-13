"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { toUserError, type ActionState } from "@/lib/errors";
import { formDate, formNumber, formOptionalText, formText } from "@/lib/form";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function createExpenseAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser();
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.rpc("app_create_expense", {
      p_title: formText(formData, "title"),
      p_category: formText(formData, "category"),
      p_amount: formNumber(formData, "amount"),
      p_note: formOptionalText(formData, "note"),
      p_created_by: user.id,
      p_created_at: formDate(formData, "created_at")
    });

    if (error) {
      throw error;
    }

    revalidatePath("/");
    revalidatePath("/expenses");
    revalidatePath("/reports");

    return {
      ok: true,
      message: "Xarajat yozildi va pul balansidan ayrildi."
    };
  } catch (error) {
    return {
      error: toUserError(error)
    };
  }
}

export async function cancelExpenseAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser();
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.rpc("app_cancel_expense", {
      p_expense_id: formText(formData, "expense_id"),
      p_reason: formOptionalText(formData, "cancel_reason") || "Xarajat bekor qilindi.",
      p_user_id: user.id
    });

    if (error) {
      throw error;
    }

    revalidatePath("/");
    revalidatePath("/expenses");
    revalidatePath("/reports");

    return {
      ok: true,
      message: "Xarajat bekor qilindi va balans teskari yozuv bilan tuzatildi."
    };
  } catch (error) {
    return {
      error: toUserError(error)
    };
  }
}

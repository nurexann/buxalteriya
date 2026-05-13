"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { toUserError, type ActionState } from "@/lib/errors";
import { formDate, formNumber, formOptionalText, formText } from "@/lib/form";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function createPurchaseAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser();
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.rpc("app_create_purchase", {
      p_product_id: formText(formData, "product_id"),
      p_quantity: formNumber(formData, "quantity"),
      p_unit_price: formNumber(formData, "unit_price"),
      p_note: formOptionalText(formData, "note"),
      p_created_by: user.id,
      p_created_at: formDate(formData, "created_at")
    });

    if (error) {
      throw error;
    }

    revalidatePath("/");
    revalidatePath("/purchases");
    revalidatePath("/stock");
    revalidatePath("/reports");

    return {
      ok: true,
      message: "Kirim yozildi va ombor qoldig'i oshdi."
    };
  } catch (error) {
    return {
      error: toUserError(error)
    };
  }
}

export async function cancelPurchaseAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser();
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.rpc("app_cancel_purchase", {
      p_purchase_id: formText(formData, "purchase_id"),
      p_reason: formOptionalText(formData, "cancel_reason") || "Kirim bekor qilindi.",
      p_user_id: user.id
    });

    if (error) {
      throw error;
    }

    revalidatePath("/");
    revalidatePath("/purchases");
    revalidatePath("/stock");

    return {
      ok: true,
      message: "Kirim bekor qilindi."
    };
  } catch (error) {
    return {
      error: toUserError(error)
    };
  }
}

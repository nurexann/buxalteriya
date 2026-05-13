"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { toUserError, type ActionState } from "@/lib/errors";
import { formDate, formNumber, formOptionalText, formText } from "@/lib/form";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function createSaleAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser();
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.rpc("app_create_sale", {
      p_product_id: formText(formData, "product_id"),
      p_quantity: formNumber(formData, "quantity"),
      p_unit_price: formNumber(formData, "unit_price"),
      p_discount: formNumber(formData, "discount"),
      p_note: formOptionalText(formData, "note"),
      p_created_by: user.id,
      p_created_at: formDate(formData, "created_at")
    });

    if (error) {
      throw error;
    }

    revalidatePath("/");
    revalidatePath("/sales");
    revalidatePath("/stock");
    revalidatePath("/reports");

    return {
      ok: true,
      message: "Sotuv yozildi, ombor va pul balansi yangilandi."
    };
  } catch (error) {
    return {
      error: toUserError(error)
    };
  }
}

export async function cancelSaleAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser();
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.rpc("app_cancel_sale", {
      p_sale_id: formText(formData, "sale_id"),
      p_reason: formOptionalText(formData, "cancel_reason") || "Sotuv bekor qilindi.",
      p_user_id: user.id
    });

    if (error) {
      throw error;
    }

    revalidatePath("/");
    revalidatePath("/sales");
    revalidatePath("/stock");
    revalidatePath("/reports");

    return {
      ok: true,
      message: "Sotuv bekor qilindi va tovar omborga qaytdi."
    };
  } catch (error) {
    return {
      error: toUserError(error)
    };
  }
}

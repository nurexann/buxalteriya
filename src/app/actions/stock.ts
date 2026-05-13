"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { toUserError, type ActionState } from "@/lib/errors";
import { formNumber, formOptionalText, formText } from "@/lib/form";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function createManualStockMovementAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser();
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.rpc("app_manual_stock_movement", {
      p_product_id: formText(formData, "product_id"),
      p_type: formText(formData, "type"),
      p_quantity: formNumber(formData, "quantity"),
      p_unit_price: formNumber(formData, "unit_price"),
      p_reason: formOptionalText(formData, "reason"),
      p_user_id: user.id
    });

    if (error) {
      throw error;
    }

    revalidatePath("/");
    revalidatePath("/stock");
    revalidatePath("/products");

    return {
      ok: true,
      message: "Ombor harakati yozildi."
    };
  } catch (error) {
    return {
      error: toUserError(error)
    };
  }
}

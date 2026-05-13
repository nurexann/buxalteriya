"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { toUserError, type ActionState } from "@/lib/errors";
import { formText } from "@/lib/form";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function restoreCategoryAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser();
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.rpc("app_restore_category", {
      p_category_id: formText(formData, "category_id"),
      p_user_id: user.id
    });

    if (error) {
      throw error;
    }

    revalidatePath("/trash");
    revalidatePath("/settings");

    return {
      ok: true,
      message: "Kategoriya tiklandi."
    };
  } catch (error) {
    return {
      error: toUserError(error)
    };
  }
}

export async function permanentDeleteCategoryAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser();
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.rpc("app_permanent_delete_category", {
      p_category_id: formText(formData, "category_id"),
      p_user_id: user.id
    });

    if (error) {
      throw error;
    }

    revalidatePath("/trash");
    revalidatePath("/settings");

    return {
      ok: true,
      message: "Kategoriya butunlay o'chirildi."
    };
  } catch (error) {
    return {
      error: toUserError(error)
    };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { toUserError, type ActionState } from "@/lib/errors";
import {
  formBoolean,
  formNullableUuid,
  formNumber,
  formOptionalText,
  formText
} from "@/lib/form";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const productSchema = z.object({
  name: z.string().min(1, "Tovar nomi kerak."),
  sku: z.string().min(1, "SKU/unikal nom kerak."),
  categoryId: z.string().uuid().nullable(),
  imageUrl: z.string().nullable(),
  imagePath: z.string().nullable(),
  purchasePrice: z.number().min(0),
  salePrice: z.number().min(0),
  initialQuantity: z.number().min(0),
  minQuantity: z.number().min(0),
  note: z.string().nullable(),
  isActive: z.boolean()
});

function parseProductForm(formData: FormData) {
  return productSchema.parse({
    name: formText(formData, "name"),
    sku: formText(formData, "sku"),
    categoryId: formNullableUuid(formData, "category_id"),
    imageUrl: formOptionalText(formData, "image_url"),
    imagePath: formOptionalText(formData, "image_path"),
    purchasePrice: formNumber(formData, "purchase_price"),
    salePrice: formNumber(formData, "sale_price"),
    initialQuantity: formNumber(formData, "initial_quantity"),
    minQuantity: formNumber(formData, "min_quantity"),
    note: formOptionalText(formData, "note"),
    isActive: formBoolean(formData, "is_active", true)
  });
}

export async function createProductAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser();
    const input = parseProductForm(formData);
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.rpc("app_create_product", {
      p_name: input.name,
      p_sku: input.sku,
      p_category_id: input.categoryId,
      p_image_url: input.imageUrl,
      p_image_path: input.imagePath,
      p_purchase_price: input.purchasePrice,
      p_sale_price: input.salePrice,
      p_initial_quantity: input.initialQuantity,
      p_min_quantity: input.minQuantity,
      p_note: input.note,
      p_is_active: input.isActive,
      p_user_id: user.id
    });

    if (error) {
      throw error;
    }

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/stock");

    return {
      ok: true,
      message: "Tovar qo'shildi."
    };
  } catch (error) {
    return {
      error: toUserError(error)
    };
  }
}

export async function updateProductAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser();
    const productId = formText(formData, "product_id");
    const input = parseProductForm(formData);
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.rpc("app_update_product", {
      p_product_id: productId,
      p_name: input.name,
      p_sku: input.sku,
      p_category_id: input.categoryId,
      p_image_url: input.imageUrl,
      p_image_path: input.imagePath,
      p_purchase_price: input.purchasePrice,
      p_sale_price: input.salePrice,
      p_min_quantity: input.minQuantity,
      p_note: input.note,
      p_is_active: input.isActive,
      p_user_id: user.id
    });

    if (error) {
      throw error;
    }

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${productId}/edit`);
    revalidatePath("/stock");

    return {
      ok: true,
      message: "Tovar yangilandi."
    };
  } catch (error) {
    return {
      error: toUserError(error)
    };
  }
}

export async function softDeleteProductAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser();
    const productId = formText(formData, "product_id");
    const reason =
      formOptionalText(formData, "delete_reason") ||
      "Foydalanuvchi tomonidan korzinkaga o'tkazildi.";
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.rpc("app_soft_delete_product", {
      p_product_id: productId,
      p_reason: reason,
      p_user_id: user.id
    });

    if (error) {
      throw error;
    }

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/trash");
    revalidatePath("/stock");

    return {
      ok: true,
      message: "Tovar korzinkaga o'tkazildi."
    };
  } catch (error) {
    return {
      error: toUserError(error)
    };
  }
}

export async function restoreProductAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser();
    const productId = formText(formData, "product_id");
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.rpc("app_restore_product", {
      p_product_id: productId,
      p_user_id: user.id
    });

    if (error) {
      throw error;
    }

    revalidatePath("/products");
    revalidatePath("/trash");

    return {
      ok: true,
      message: "Tovar tiklandi."
    };
  } catch (error) {
    return {
      error: toUserError(error)
    };
  }
}

export async function permanentDeleteProductAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser();
    const productId = formText(formData, "product_id");
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc("app_permanent_delete_product", {
      p_product_id: productId,
      p_user_id: user.id
    });

    if (error) {
      throw error;
    }

    const deletedPaths = (data || [])
      .filter((item: { outcome: string; image_path: string | null }) => item.outcome === "deleted" && item.image_path)
      .map((item: { image_path: string }) => item.image_path);

    if (deletedPaths.length) {
      await supabase.storage.from("product-images").remove(deletedPaths);
    }

    revalidatePath("/trash");

    const retained = (data || []).some(
      (item: { outcome: string }) => item.outcome === "retained_history"
    );

    return {
      ok: true,
      message: retained
        ? "Tarixiy yozuvlar borligi uchun tovar fizik o'chirilmadi, arxivda saqlandi."
        : "Tovar butunlay o'chirildi."
    };
  } catch (error) {
    return {
      error: toUserError(error)
    };
  }
}

export async function createCategoryAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser();
    const name = formText(formData, "name");
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.rpc("app_create_category", {
      p_name: name,
      p_user_id: user.id
    });

    if (error) {
      throw error;
    }

    revalidatePath("/settings");
    revalidatePath("/products");

    return {
      ok: true,
      message: "Kategoriya qo'shildi."
    };
  } catch (error) {
    return {
      error: toUserError(error)
    };
  }
}

export async function softDeleteCategoryAction(formData: FormData) {
  const user = await requireUser();
  const supabase = getSupabaseAdmin();
  await supabase.rpc("app_soft_delete_category", {
    p_category_id: formText(formData, "category_id"),
    p_reason: formOptionalText(formData, "delete_reason") || "Korzinkaga o'tkazildi.",
    p_user_id: user.id
  });

  revalidatePath("/settings");
  revalidatePath("/trash");
  redirect("/settings");
}

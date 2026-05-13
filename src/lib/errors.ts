const dbErrorMap: Record<string, string> = {
  insufficient_stock: "Omborda yetarli tovar yo'q.",
  product_not_found: "Tovar topilmadi.",
  quantity_positive_required: "Soni 0 dan katta bo'lishi kerak.",
  amount_positive_required: "Summa 0 dan katta bo'lishi kerak.",
  duplicate_sku: "Bu SKU/unikal nom allaqachon mavjud.",
  total_negative: "Umumiy summa manfiy bo'lishi mumkin emas.",
  sale_not_found: "Sotuv topilmadi.",
  sale_already_cancelled: "Bu sotuv allaqachon bekor qilingan.",
  expense_not_found: "Xarajat topilmadi.",
  expense_already_cancelled: "Bu xarajat allaqachon bekor qilingan.",
  purchase_not_found: "Kirim topilmadi.",
  purchase_already_cancelled: "Bu kirim allaqachon bekor qilingan."
};

export function toUserError(error: unknown) {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";

  for (const [code, label] of Object.entries(dbErrorMap)) {
    if (message.includes(code)) {
      return label;
    }
  }

  if (message.toLowerCase().includes("duplicate key")) {
    return dbErrorMap.duplicate_sku;
  }

  return message || "Noma'lum xatolik yuz berdi.";
}

export type ActionState = {
  ok?: boolean;
  message?: string;
  error?: string;
};

export const initialActionState: ActionState = {};

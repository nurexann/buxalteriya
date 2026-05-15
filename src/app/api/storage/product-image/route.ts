import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function extensionFromType(type: string) {
  return (
    {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif"
    }[type] || "bin"
  );
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Rasm fayli yuborilmadi." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Faqat JPG, PNG, WEBP yoki GIF rasm yuklash mumkin." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Rasm hajmi 5 MB dan oshmasin." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    
    // YUQORI DARAJADA: Agar bucket yo'q bo'lsa, uni avtomatik yaratishga urinib ko'ramiz
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find((b: { name: string }) => b.name === "product-images")) {
      await supabase.storage.createBucket("product-images", { public: true });
    }

    const path = `${user.id}/${Date.now()}-${randomUUID()}.${extensionFromType(file.type)}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, bytes, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(path);

    return NextResponse.json({
      url: data.publicUrl,
      path
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Rasm yuklashda xatolik yuz berdi."
      },
      { status: 500 }
    );
  }
}

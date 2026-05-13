import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await readSession();

  if (!user) {
    return NextResponse.json({ error: "Kirish kerak." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  const categoryId = searchParams.get("category_id");
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("products")
    .select(
      "id,name,sku,image_url,purchase_price,sale_price,quantity,min_quantity,category_id"
    )
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(12);

  if (q) {
    const safeQ = q.replaceAll("%", "\\%").replaceAll("_", "\\_");
    query = query.or(`sku.ilike.%${safeQ}%,name.ilike.%${safeQ}%`);
  }

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ products: data || [] });
}

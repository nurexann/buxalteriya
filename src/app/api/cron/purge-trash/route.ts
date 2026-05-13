import { NextResponse } from "next/server";
import { getOptionalEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = getOptionalEnv("CRON_SECRET");

  if (!secret) {
    return false;
  }

  const auth = request.headers.get("authorization");
  const url = new URL(request.url);

  return auth === `Bearer ${secret}` || url.searchParams.get("secret") === secret;
}

async function purge(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Cron secret noto'g'ri." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("app_purge_trash", {
    p_user_id: "vercel-cron"
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const imagePaths = (data || [])
    .filter((item: { outcome: string; image_path: string | null }) => item.outcome === "deleted" && item.image_path)
    .map((item: { image_path: string }) => item.image_path);

  if (imagePaths.length) {
    await supabase.storage.from("product-images").remove(imagePaths);
  }

  return NextResponse.json({
    ok: true,
    purged: data || [],
    removedImages: imagePaths.length
  });
}

export async function GET(request: Request) {
  return purge(request);
}

export async function POST(request: Request) {
  return purge(request);
}

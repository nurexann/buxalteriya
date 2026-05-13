import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\n") || text.includes('"')) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function toCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) {
    return "empty\n";
  }

  const headers = Object.keys(rows[0]);
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))
  ].join("\n");
}

export async function GET(request: Request) {
  await requireUser();

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "sales";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const supabase = getSupabaseAdmin();

  const tableMap: Record<string, string> = {
    sales: "sales",
    purchases: "purchases",
    expenses: "expenses",
    stock: "stock_movements",
    money: "money_movements"
  };
  const table = tableMap[type] || "sales";

  let query = supabase.from(table).select("*").order("created_at", { ascending: false });

  if (from) {
    query = query.gte("created_at", from);
  }

  if (to) {
    query = query.lte("created_at", to);
  }

  const { data, error } = await query.limit(5000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(toCsv((data || []) as Array<Record<string, unknown>>), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}-hisobot.csv"`
    }
  });
}

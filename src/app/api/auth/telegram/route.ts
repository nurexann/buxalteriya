import { NextResponse } from "next/server";
import { setSession } from "@/lib/auth/session";
import { verifyTelegramInitData } from "@/lib/auth/telegram";
import { getOptionalEnv, getRequiredEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { initData } = (await request.json()) as { initData?: string };

    if (!initData) {
      return NextResponse.json(
        { error: "Telegram initData yuborilmadi." },
        { status: 400 }
      );
    }

    const telegramUser = verifyTelegramInitData(
      initData,
      getRequiredEnv("TELEGRAM_BOT_TOKEN")
    );
    const adminId = getOptionalEnv("TELEGRAM_ADMIN_ID");

    if (adminId && String(telegramUser.id) !== adminId) {
      return NextResponse.json(
        { error: "Bu Mini App faqat egasi uchun ochiq." },
        { status: 403 }
      );
    }

    await setSession({
      id: `telegram:${telegramUser.id}`,
      kind: "telegram",
      name:
        telegramUser.username ||
        [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(" ") ||
        "Telegram user"
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Telegram auth xatoligi yuz berdi."
      },
      { status: 401 }
    );
  }
}

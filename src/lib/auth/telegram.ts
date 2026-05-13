import { createHmac, timingSafeEqual } from "node:crypto";

export type TelegramAuthUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

export function verifyTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 60 * 60 * 24 * 7
) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) {
    throw new Error("Telegram hash topilmadi.");
  }

  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const hashBuffer = Buffer.from(hash, "hex");
  const computedBuffer = Buffer.from(computedHash, "hex");

  if (
    hashBuffer.length !== computedBuffer.length ||
    !timingSafeEqual(hashBuffer, computedBuffer)
  ) {
    throw new Error("Telegram initData tasdiqlanmadi.");
  }

  const authDate = Number(params.get("auth_date"));
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (!authDate || nowSeconds - authDate > maxAgeSeconds) {
    throw new Error("Telegram sessiya muddati tugagan.");
  }

  const rawUser = params.get("user");

  if (!rawUser) {
    throw new Error("Telegram user ma'lumoti topilmadi.");
  }

  return JSON.parse(rawUser) as TelegramAuthUser;
}

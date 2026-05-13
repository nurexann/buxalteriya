import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getOptionalEnv, isProduction } from "@/lib/env";

const SESSION_COOKIE = "ombor_session";
const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

export type SessionUser = {
  id: string;
  kind: "owner" | "telegram";
  name: string;
  exp: number;
};

function base64Url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function fromBase64Url(input: string) {
  const normalized = input.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  );

  return Buffer.from(padded, "base64").toString("utf8");
}

function sessionSecret() {
  const secret = [
    getOptionalEnv("OWNER_PASSWORD"),
    getOptionalEnv("TELEGRAM_BOT_TOKEN"),
    getOptionalEnv("CRON_SECRET")
  ]
    .filter(Boolean)
    .join(":");

  if (!secret && isProduction()) {
    throw new Error("Session uchun OWNER_PASSWORD yoki TELEGRAM_BOT_TOKEN kerak.");
  }

  return secret || "dev-only-session-secret";
}

function sign(payload: string) {
  return base64Url(createHmac("sha256", sessionSecret()).update(payload).digest());
}

export function createSessionToken(user: Omit<SessionUser, "exp">) {
  const payload = base64Url(
    JSON.stringify({
      ...user,
      exp: Math.floor(Date.now() / 1000) + THIRTY_DAYS_SECONDS
    })
  );
  const signature = sign(payload);

  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined): SessionUser | null {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const user = JSON.parse(fromBase64Url(payload)) as SessionUser;

    if (!user.exp || user.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export async function readSession() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function setSession(user: Omit<SessionUser, "exp">) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    maxAge: THIRTY_DAYS_SECONDS,
    path: "/"
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireUser() {
  const user = await readSession();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export function getDevOwnerPassword() {
  return getOptionalEnv("OWNER_PASSWORD") || (isProduction() ? undefined : "owner");
}

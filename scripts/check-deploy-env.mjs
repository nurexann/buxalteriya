import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envFiles = [".env.local", ".env.production.local", ".env.production", ".env"];

function parseEnvFile(path) {
  if (!existsSync(path)) {
    return {};
  }

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        if (index === -1) {
          return [line, ""];
        }
        return [line.slice(0, index), line.slice(index + 1).replace(/^["']|["']$/g, "")];
      })
  );
}

const fileEnv = envFiles.reduce((result, file) => {
  return { ...result, ...parseEnvFile(resolve(process.cwd(), file)) };
}, {});

const env = { ...fileEnv, ...process.env };

function value(name) {
  return env[name]?.trim();
}

function hasAny(names) {
  return names.some((name) => Boolean(value(name)));
}

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_ADMIN_ID",
  "TELEGRAM_WEBAPP_URL",
  "CRON_SECRET",
  "OWNER_PASSWORD"
];

const missing = required.filter((name) => !value(name));

if (!hasAny(["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"])) {
  missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY yoki NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

if (!hasAny(["SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"])) {
  missing.push("SUPABASE_SECRET_KEY yoki SUPABASE_SERVICE_ROLE_KEY");
}

const warnings = [];
const supabaseUrl = value("NEXT_PUBLIC_SUPABASE_URL");
const webappUrl = value("TELEGRAM_WEBAPP_URL");
const cronSecret = value("CRON_SECRET");
const ownerPassword = value("OWNER_PASSWORD");

if (supabaseUrl && !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl)) {
  warnings.push("NEXT_PUBLIC_SUPABASE_URL production uchun https://PROJECT_REF.supabase.co ko'rinishida bo'lishi kerak.");
}

if (webappUrl && !/^https:\/\//i.test(webappUrl)) {
  warnings.push("TELEGRAM_WEBAPP_URL Telegram Mini App uchun HTTPS bo'lishi kerak.");
}

if (cronSecret && cronSecret.length < 16) {
  warnings.push("CRON_SECRET kamida 16 ta belgidan iborat random qiymat bo'lsin.");
}

if (cronSecret && /\s/.test(cronSecret)) {
  warnings.push("CRON_SECRET ichida bo'sh joy yoki yangi qator bo'lmasin.");
}

if (ownerPassword && ownerPassword === "owner") {
  warnings.push("OWNER_PASSWORD production uchun default 'owner' bo'lib qolmasin.");
}

if (missing.length) {
  console.error("Deploy env tekshiruvi xato. Quyidagilar yetishmayapti:");
  for (const item of missing) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

if (warnings.length) {
  console.warn("Deploy env ogohlantirishlari:");
  for (const item of warnings) {
    console.warn(`- ${item}`);
  }
} else {
  console.log("Deploy env tayyor: Supabase, Telegram, Vercel Cron va owner login sozlangan.");
}

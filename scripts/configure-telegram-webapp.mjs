import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

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

const env = {
  ...parseEnvFile(resolve(process.cwd(), ".env.local")),
  ...parseEnvFile(resolve(process.cwd(), ".env.production.local")),
  ...parseEnvFile(resolve(process.cwd(), ".env.production")),
  ...process.env
};

const token = env.TELEGRAM_BOT_TOKEN?.trim();
const adminId = env.TELEGRAM_ADMIN_ID?.trim();
const webappUrl = env.TELEGRAM_WEBAPP_URL?.trim();

if (!token || !adminId || !webappUrl) {
  console.error("TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_ID va TELEGRAM_WEBAPP_URL kerak.");
  process.exit(1);
}

if (!/^https:\/\//i.test(webappUrl)) {
  console.error("TELEGRAM_WEBAPP_URL HTTPS bo'lishi kerak.");
  process.exit(1);
}

const api = `https://api.telegram.org/bot${token}`;
const menuButton = {
  type: "web_app",
  text: "Omborni ochish",
  web_app: { url: webappUrl }
};

async function post(method, body) {
  const response = await fetch(`${api}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const json = await response.json();

  if (!json.ok) {
    throw new Error(`${method}: ${json.description || "Telegram API xatoligi"}`);
  }

  return json;
}

await post("setChatMenuButton", { menu_button: menuButton });
await post("setChatMenuButton", { chat_id: Number(adminId), menu_button: menuButton });
await post("sendMessage", {
  chat_id: Number(adminId),
  text: "Ombor Mini App production URL bilan ulandi.",
  reply_markup: {
    inline_keyboard: [[{ text: "Mini Appni ochish", web_app: { url: webappUrl } }]]
  }
});

console.log(`Telegram menu tayyor: ${webappUrl}`);

import express from "express";
import fs from "fs";
import path from "path";
import { getGmailClient, listUnread, getMeta, markRead } from "./gmail.js";
import { sendTelegramMessage } from "./telegram.js";

import { initCredentials } from "./bootstrap.js";

initCredentials();

const app = express();
const PORT = process.env.PORT || 10000;

// ================== HEALTH CHECK ==================
app.get("/", (req, res) => {
  res.send("OK");
});

// ================== BASE64 -> FILE ==================
function ensureFileFromEnv(envName, filePath) {
  const value = process.env[envName];

  if (!value) {
    throw new Error(`Missing ${envName} in ENV`);
  }

  if (!fs.existsSync(filePath)) {
    const buffer = Buffer.from(value, "base64");
    fs.writeFileSync(filePath, buffer);
    console.log(`✅ ${filePath} created from ENV`);
  }
}

// ================== MAIN LOOP ==================
async function startBot() {
  try {
    console.log("🚀 Запуск Gmail клиента...");

    // создаём файлы из ENV
    ensureFileFromEnv("GOOGLE_CREDENTIALS_BASE64", "credentials.json");

    if (process.env.GOOGLE_TOKEN_BASE64) {
      ensureFileFromEnv("GOOGLE_TOKEN_BASE64", "token.json");
    }

    const gmail = await getGmailClient();

    console.log("✅ Gmail подключен");

    setInterval(async () => {
      try {
        const messages = await listUnread(gmail, 5);

        for (const msg of messages) {
          const meta = await getMeta(gmail, msg.id);

          const text = `
📩 Новое письмо

👤 ${meta.from}
📝 ${meta.subject}
📅 ${meta.date}

${meta.snippet}
          `;

          await sendTelegramMessage(text);
          await markRead(gmail, msg.id);

          console.log("📤 Отправлено в Telegram:", meta.subject);
        }
      } catch (err) {
        console.error("❌ Ошибка цикла:", err.message);
      }
    }, 10000); // каждые 10 сек
  } catch (err) {
    console.error("❌ Main error:", err.message);
  }
}

// ================== START ==================
app.listen(PORT, () => {
  console.log(`🌍 HTTP server on ${PORT}`);
});

startBot();

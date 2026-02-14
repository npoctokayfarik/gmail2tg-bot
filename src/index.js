import express from "express";
import { bootstrapSecrets } from "./bootstrap.js";
import { getGmailClient, listUnread, getMeta, markRead } from "./gmail.js";
import { sendTelegramMessage } from "./telegram.js";

// 1) Сначала создаём credentials.json/token.json из ENV (Render)
bootstrapSecrets();

// 2) HTTP сервер для Render + UptimeRobot
const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => res.status(200).send("OK"));
app.get("/health", (req, res) => res.status(200).json({ ok: true }));

app.listen(PORT, () => console.log(`🌍 HTTP server on ${PORT}`));

// 3) Gmail polling
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 10000);
const MAX_PER_TICK = Number(process.env.MAX_PER_TICK || 5);

function buildText(meta) {
  return (
    `📩 Новое письмо\n\n` +
    `👤 ${meta.from || "(no from)"}\n` +
    `📝 ${meta.subject || "(no subject)"}\n` +
    `📅 ${meta.date || ""}\n\n` +
    `${meta.snippet || ""}`
  );
}

async function startBot() {
  try {
    console.log("🚀 Запуск Gmail клиента...");
    const gmail = getGmailClient();
    console.log("✅ Gmail подключен");

    setInterval(async () => {
      try {
        const messages = await listUnread(gmail, MAX_PER_TICK);

        for (const msg of messages) {
          const meta = await getMeta(gmail, msg.id);

          await sendTelegramMessage(buildText(meta));
          await markRead(gmail, msg.id);

          console.log("📤 Отправлено в Telegram:", meta.subject || msg.id);
        }
      } catch (err) {
        console.error("❌ Ошибка цикла:", err?.message || err);
      }
    }, POLL_INTERVAL_MS);
  } catch (err) {
    console.error("❌ Main error:", err?.message || err);
  }
}

startBot();

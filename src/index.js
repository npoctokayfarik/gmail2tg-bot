import express from "express";
import dotenv from "dotenv";
dotenv.config();

import { getGmailClient, listUnread, getMeta, markRead } from "./gmail.js";
import { sendTelegramMessage } from "./telegram.js";

const app = express();
const PORT = process.env.PORT || 3000;

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 15000); // 15 сек
const MAX_PER_TICK = Number(process.env.MAX_PER_TICK || 5); // сколько писем за раз

app.get("/", (req, res) => res.send("Bot is running 🚀"));
app.get("/health", (req, res) => res.status(200).send("OK"));

function formatMessage(m) {
  const from = m.from || "(no from)";
  const subject = m.subject || "(no subject)";
  const date = m.date || "";
  const snippet = m.snippet || "";

  return `📩 *Новое письмо*\n` +
    `👤 *From:* ${from}\n` +
    `🧾 *Subject:* ${subject}\n` +
    (date ? `🕒 *Date:* ${date}\n` : "") +
    `\n${snippet}`;
}

async function tick(gmail) {
  const messages = await listUnread(gmail, MAX_PER_TICK);

  if (!messages.length) return;

  for (const m of messages) {
    const meta = await getMeta(gmail, m.id);

    await sendTelegramMessage(formatMessage(meta));
    await markRead(gmail, m.id);

    console.log("✅ Переслал и пометил прочитанным:", meta.subject);
  }
}

async function main() {
  console.log("🚀 Запуск Gmail клиента...");
  const gmail = await getGmailClient();
  console.log("✅ Gmail подключён. Стартуем polling:", POLL_INTERVAL_MS, "ms");

  await tick(gmail);
  setInterval(() => {
    tick(gmail).catch((e) => console.error("Tick error:", e.message));
  }, POLL_INTERVAL_MS);
}

app.listen(PORT, () => console.log("🌐 HTTP server on", PORT));
main().catch((e) => console.error("Main error:", e.message));

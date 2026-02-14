import "dotenv/config";
import express from "express";

import { bootstrapFiles } from "./bootstrap.js";
import { getGmailClient, listUnread, getMeta, markRead } from "./gmail.js";
import { sendTelegramMessage } from "./telegram.js";

const PORT = Number(process.env.PORT || 10000);
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 15000);

function prettyMail(m) {
  const lines = [];
  if (m.subject) lines.push(`📩 ${m.subject}`);
  if (m.from) lines.push(`👤 ${m.from}`);
  if (m.date) lines.push(`🕒 ${m.date}`);
  if (m.snippet) lines.push(`\n${m.snippet}`);
  return lines.join("\n");
}

async function tick(gmail) {
  const msgs = await listUnread(gmail, 10);
  if (!msgs.length) return;

  // чтобы не попасть в спам/лимиты — отправляем по одному
  for (const x of msgs) {
    const meta = await getMeta(gmail, x.id);

    await sendTelegramMessage(prettyMail(meta));
    await markRead(gmail, x.id);

    console.log(`✅ Переслал и пометил прочитанным: ${meta.subject || meta.id}`);
  }
}

async function main() {
  // 1) Поднимаем HTTP сервер для Render + UptimeRobot
  const app = express();

  app.get("/", (req, res) => res.status(200).send("OK"));
  app.get("/health", (req, res) => res.status(200).json({ ok: true }));

  app.listen(PORT, () => console.log(`✅ HTTP server on ${PORT}`));

  // 2) Восстанавливаем файлы credentials/token из ENV
  bootstrapFiles();

  // 3) Gmail client
  console.log("🚀 Запуск Gmail клиента...");
  const gmail = getGmailClient();
  console.log("✅ Gmail клиент готов");

  // 4) Первый тик сразу, потом по интервалу
  await tick(gmail);
  setInterval(() => {
    tick(gmail).catch((e) => console.error("Tick error:", e.message));
  }, POLL_INTERVAL_MS);

  console.log("✅ Bot is running 24/7");
}

main().catch((e) => {
  console.error("Main error:", e.message);
  process.exit(1);
});

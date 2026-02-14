import "dotenv/config";
import { getGmailClient, listUnread, getMeta, markRead } from "./gmail.js";
import { sendTelegramMessage } from "./telegram.js";
import express from "express";
import { bootstrapFiles } from "./bootstrap.js";
bootstrapFiles();


const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 60000);

const app = express();
const PORT = process.env.PORT || 3000;

function escape(s = "") {
  return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

async function tick(gmail) {
  const msgs = await listUnread(gmail, 10);
  if (!msgs.length) {
    console.log("Новых писем нет");
    return;
  }

  for (const m of msgs) {
    const d = await getMeta(gmail, m.id);

    const text =
      `📩 <b>${escape(d.subject || "(без темы)")}</b>\n` +
      `👤 <b>From:</b> ${escape(d.from)}\n` +
      `🕒 <b>Date:</b> ${escape(d.date)}\n\n` +
      `${escape(d.snippet)}`;

    // В telegram.js сейчас без parse_mode — если хочешь HTML, скажи, добавлю обратно
    await sendTelegramMessage(text.replaceAll(/<\/?b>/g, "")); // простой текст без HTML

    await markRead(gmail, m.id);
    console.log("Переслал и пометил прочитанным:", d.subject);
  }
}

app.get("/health", (req, res) => res.status(200).send("ok"));
app.listen(PORT, () => console.log("✅ Health server:", PORT));

async function main() {
  const gmail = await getGmailClient();
  console.log("✅ Gmail connected. Poll:", POLL_INTERVAL_MS, "ms");

  await tick(gmail);
  setInterval(() => tick(gmail).catch((e) => console.error("Tick error:", e.message)), POLL_INTERVAL_MS);
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});

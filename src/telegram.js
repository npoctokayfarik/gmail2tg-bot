import axios from "axios";

function must(v, name) {
  if (!v || !String(v).trim()) throw new Error(`Missing ${name} in .env`);
  return String(v).trim();
}

export async function sendTelegramMessage(text) {
  const token = must(process.env.TELEGRAM_BOT_TOKEN, "TELEGRAM_BOT_TOKEN");
  const chatId = must(process.env.TELEGRAM_CHAT_ID, "TELEGRAM_CHAT_ID");

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const res = await axios.post(url, {
      chat_id: chatId,
      text: text ?? "",
      disable_web_page_preview: true,
    });
    return res.data;
  } catch (err) {
    const status = err.response?.status;
    const data = err.response?.data;

    // Самое важное: Telegram почти всегда пишет норм описание
    const desc = data?.description || err.message;

    throw new Error(
      `Telegram API error${status ? ` (${status})` : ""}: ${desc}`
    );
  }
}

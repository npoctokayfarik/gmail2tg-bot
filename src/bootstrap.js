import fs from "fs";
import path from "path";

/**
 * Берём значение из ENV по одному из возможных ключей.
 */
function pickEnv(...names) {
  for (const n of names) {
    const v = process.env[n];
    if (v && String(v).trim()) return String(v).trim();
  }
  return "";
}

/**
 * Нормализуем base64: убираем пробелы/переводы строк.
 */
function cleanBase64(s) {
  return String(s).replace(/\s+/g, "");
}

/**
 * Декод base64 -> utf8 string
 */
function decodeBase64ToText(b64) {
  const cleaned = cleanBase64(b64);
  return Buffer.from(cleaned, "base64").toString("utf-8");
}

/**
 * Пишем файл только если его нет (или если force=true)
 */
function writeFileSafe(filePath, content, { force = false } = {}) {
  if (!force && fs.existsSync(filePath)) return false;
  fs.writeFileSync(filePath, content, "utf-8");
  return true;
}

/**
 * Создаёт credentials.json / token.json из ENV (base64) если файлов нет.
 * Возвращает пути к файлам.
 */
export function bootstrapSecrets() {
  const root = process.cwd();

  const credentialsPath = path.resolve(root, "credentials.json");
  const tokenPath = path.resolve(root, "token.json");

  // ✅ Поддерживаем оба нейминга (как у тебя на Render и как в логах)
  const credsB64 = pickEnv("CREDENTIALS_JSON_B64", "GOOGLE_CREDENTIALS_BASE64");
  const tokenB64 = pickEnv("TOKEN_JSON_B64", "GOOGLE_TOKEN_BASE64");

  if (!fs.existsSync(credentialsPath)) {
    if (!credsB64) {
      throw new Error(
        "Missing credentials in ENV. Add one of: CREDENTIALS_JSON_B64 or GOOGLE_CREDENTIALS_BASE64"
      );
    }
    const credsText = decodeBase64ToText(credsB64);
    writeFileSafe(credentialsPath, credsText, { force: true });
    console.log("✅ credentials.json created from ENV");
  } else {
    console.log("ℹ️ credentials.json already exists");
  }

  if (!fs.existsSync(tokenPath)) {
    if (!tokenB64) {
      throw new Error(
        "Missing token in ENV. Add one of: TOKEN_JSON_B64 or GOOGLE_TOKEN_BASE64"
      );
    }
    const tokenText = decodeBase64ToText(tokenB64);
    writeFileSafe(tokenPath, tokenText, { force: true });
    console.log("✅ token.json created from ENV");
  } else {
    console.log("ℹ️ token.json already exists");
  }

  return { credentialsPath, tokenPath };
}

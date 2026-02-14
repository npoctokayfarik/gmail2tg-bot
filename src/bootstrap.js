import fs from "fs";
import path from "path";

const ROOT = process.cwd();

// пути файлов
const CREDENTIALS_PATH = path.join(ROOT, "credentials.json");
const TOKEN_PATH = path.join(ROOT, "token.json");

// проверка env
function must(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    throw new Error(`Missing ${name} in ENV`);
  }
  return String(v).trim();
}

// декод base64 → файл
function writeBase64ToFile(envName, filePath) {
  const base64 = process.env[envName];

  if (!base64) return false;

  try {
    const data = Buffer.from(base64, "base64").toString("utf-8");
    fs.writeFileSync(filePath, data, "utf-8");
    console.log(`✅ ${path.basename(filePath)} created from ENV`);
    return true;
  } catch (e) {
    console.error(`❌ Failed to decode ${envName}:`, e.message);
    return false;
  }
}

// главный запуск
export function bootstrap() {
  // credentials.json
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    writeBase64ToFile("CREDENTIALS_JSON_B64", CREDENTIALS_PATH);
  }

  // token.json
  if (!fs.existsSync(TOKEN_PATH)) {
    writeBase64ToFile("TOKEN_JSON_B64", TOKEN_PATH);
  }

  // проверка
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error("credentials.json not found");
  }

  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error("token.json not found");
  }
}

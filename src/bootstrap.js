import fs from "fs";

function writeFromB64(envName, filename) {
  const b64 = process.env[envName];
  if (!b64) return;

  if (!fs.existsSync(filename)) {
    const data = Buffer.from(b64, "base64").toString("utf-8");
    fs.writeFileSync(filename, data, "utf-8");
    console.log(`✅ restored ${filename}`);
  }
}

export function bootstrapFiles() {
  writeFromB64("CREDENTIALS_JSON_B64", "credentials.json");
  writeFromB64("TOKEN_JSON_B64", "token.json");
}

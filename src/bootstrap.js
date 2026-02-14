import fs from "fs";

function must(v, name) {
  if (!v || !String(v).trim()) throw new Error(`Missing ${name} in ENV`);
  return String(v).trim();
}

function writeFromB64(envName, outFile) {
  const b64 = must(process.env[envName], envName);
  const json = Buffer.from(b64, "base64").toString("utf-8");
  fs.writeFileSync(outFile, json, "utf-8");
  console.log(`✅ Restored ${outFile} from ${envName}`);
}

export function bootstrapFiles() {
  // На Render файлов нет — создаём их из ENV
  writeFromB64("GOOGLE_CREDENTIALS_BASE64", "credentials.json");
  writeFromB64("GOOGLE_TOKEN_BASE64", "token.json");
}

import fs from "fs";

function must(v, name) {
  if (!v || !String(v).trim()) {
    throw new Error(`Missing ${name} in ENV`);
  }
  return String(v).trim();
}

export function initCredentials() {
  // credentials.json
  if (!fs.existsSync("credentials.json")) {
    const b64 = must(process.env.CREDENTIALS_JSON_B64, "CREDENTIALS_JSON_B64");
    const json = Buffer.from(b64, "base64").toString("utf-8");
    fs.writeFileSync("credentials.json", json);
    console.log("✅ credentials.json created from ENV");
  }

  // token.json
  if (!fs.existsSync("token.json")) {
    const b64 = must(process.env.TOKEN_JSON_B64, "TOKEN_JSON_B64");
    const json = Buffer.from(b64, "base64").toString("utf-8");
    fs.writeFileSync("token.json", json);
    console.log("✅ token.json created from ENV");
  }
}

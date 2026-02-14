import fs from "fs";
import path from "path";
import readline from "readline";
import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/gmail.modify"];
const CREDENTIALS_PATH = path.resolve("credentials.json");
const TOKEN_PATH = path.resolve("token.json");

function loadCredentials() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error("credentials.json not found in project root");
  }
  return JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
}

async function saveToken(tokens) {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2), "utf-8");
}

async function authorize() {
  const credentials = loadCredentials();
  const info = credentials.installed || credentials.web;

  if (!info?.client_id || !info?.client_secret) {
    throw new Error("credentials.json format is wrong (missing client_id/client_secret)");
  }

  const oAuth2Client = new google.auth.OAuth2(
    info.client_id,
    info.client_secret,
    info.redirect_uris?.[0]
  );

  if (fs.existsSync(TOKEN_PATH)) {
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
    oAuth2Client.setCredentials(tokens);
    return oAuth2Client;
  }

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  console.log("\nОткрой ссылку и авторизуйся Gmail:\n", authUrl, "\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const code = await new Promise((resolve) => rl.question("Вставь code сюда: ", resolve));
  rl.close();

  const { tokens } = await oAuth2Client.getToken(code.trim());
  oAuth2Client.setCredentials(tokens);
  await saveToken(tokens);

  console.log("✅ token.json сохранён, Gmail подключён.");
  return oAuth2Client;
}

export async function getGmailClient() {
  const auth = await authorize();
  return google.gmail({ version: "v1", auth });
}

function header(headers, name) {
  const h = (headers || []).find((x) => (x.name || "").toLowerCase() === name.toLowerCase());
  return h?.value || "";
}

export async function listUnread(gmail, maxResults = 10) {
  const res = await gmail.users.messages.list({
    userId: "me",
    labelIds: ["INBOX", "UNREAD"],
    maxResults,
  });
  return res.data.messages || [];
}

export async function getMeta(gmail, id) {
  const res = await gmail.users.messages.get({
    userId: "me",
    id,
    format: "metadata",
    metadataHeaders: ["From", "Subject", "Date"],
  });

  const p = res.data.payload || {};
  const headers = p.headers || [];
  return {
    id: res.data.id,
    from: header(headers, "From"),
    subject: header(headers, "Subject"),
    date: header(headers, "Date"),
    snippet: res.data.snippet || "",
  };
}

export async function markRead(gmail, id) {
  await gmail.users.messages.modify({
    userId: "me",
    id,
    requestBody: { removeLabelIds: ["UNREAD"] },
  });
}

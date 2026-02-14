import fs from "fs";
import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/gmail.modify"];

function readJson(path) {
  if (!fs.existsSync(path)) throw new Error(`${path} not found`);
  return JSON.parse(fs.readFileSync(path, "utf-8"));
}

export function getGmailClient() {
  const CREDENTIALS_PATH = path.resolve("credentials.json");
  const TOKEN_PATH = path.resolve("token.json");

  const info = credentials.installed || credentials.web;
  if (!info?.client_id || !info?.client_secret) {
    throw new Error("credentials.json invalid (missing client_id/client_secret)");
  }

  const oAuth2Client = new google.auth.OAuth2(
    info.client_id,
    info.client_secret,
    // redirect_uri тут не критичен, потому что токен уже есть
    (info.redirect_uris && info.redirect_uris[0]) || "http://localhost"
  );

  oAuth2Client.setCredentials(token);

  return google.gmail({ version: "v1", auth: oAuth2Client });
}

function header(headers, name) {
  const h = (headers || []).find(
    (x) => (x.name || "").toLowerCase() === name.toLowerCase()
  );
  return h?.value || "";
}

export async function listUnread(gmail, maxResults = 10) {
  const res = await gmail.users.messages.list({
    userId: "me",
    labelIds: ["INBOX", "UNREAD"],
    maxResults
  });
  return res.data.messages || [];
}

export async function getMeta(gmail, id) {
  const res = await gmail.users.messages.get({
    userId: "me",
    id,
    format: "metadata",
    metadataHeaders: ["From", "Subject", "Date"]
  });

  const p = res.data.payload || {};
  const headers = p.headers || [];

  return {
    id: res.data.id,
    from: header(headers, "From"),
    subject: header(headers, "Subject"),
    date: header(headers, "Date"),
    snippet: res.data.snippet || ""
  };
}

export async function markRead(gmail, id) {
  await gmail.users.messages.modify({
    userId: "me",
    id,
    requestBody: { removeLabelIds: ["UNREAD"] }
  });
}

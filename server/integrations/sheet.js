// server/integrations/sheets.js
import { google } from "googleapis";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const TAB_SIGNINS    = "Event Signins";
const TAB_APPS       = "Application Submissions";

let _sheets; let _meta;

function getAuth() {
  // Prefer key file if provided, otherwise inline JSON
  const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
    : undefined;

  return new google.auth.GoogleAuth({
    keyFilename,
    credentials: json,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export function getSheets() {
  if (!_sheets) _sheets = google.sheets({ version: "v4", auth: getAuth() });
  return _sheets;
}

export async function ensureSheet({ spreadsheetId, title }) {
  const sheets = getSheets();
  if (!_meta) {
    _meta = await sheets.spreadsheets.get({ spreadsheetId });
  }
  const exists = _meta.data.sheets?.some(s => s.properties?.title === title);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title } } }] }
    });
    _meta = await sheets.spreadsheets.get({ spreadsheetId });
    console.log("[Sheets] created tab:", title);
  }
}

function errMsg(e) {
  return e?.response?.data?.error?.message || e?.message || String(e);
}

/** ---- Event sign-ins: Name | Email | Year | Photo ---- */
export async function appendEventSigninRow({ name, email, year, photoUrl }) {
  if (!SPREADSHEET_ID) {
    console.warn("[Sheets] SKIP: GOOGLE_SHEETS_SPREADSHEET_ID not set");
    return;
  }
  const sheets = getSheets();
  await ensureSheet({ spreadsheetId: SPREADSHEET_ID, title: TAB_SIGNINS });

  const values = [[name, email, year || "", photoUrl || ""]];
  try {
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TAB_SIGNINS}!A:D`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values },
    });

    const upd = res.data?.updates || {};
    console.log("[Sheets] OK", {
      tab: TAB_SIGNINS,
      updatedRange: upd.updatedRange,
      updatedCells: upd.updatedCells,
      row: { name, email, year: year || "", photoUrl: photoUrl || "" },
    });
    return res.data;
  } catch (e) {
    console.error("[Sheets] ERROR appendEventSigninRow:", errMsg(e));
    throw e;
  }
}

/** ---- Application submissions: First | Last | Email | Year | Photo | Resume | Response ---- */
export async function appendApplicationRow(app) {
  if (!SPREADSHEET_ID) {
    console.warn("[Sheets] SKIP: GOOGLE_SHEETS_SPREADSHEET_ID not set");
    return;
  }
  const sheets = getSheets();
  await ensureSheet({ spreadsheetId: SPREADSHEET_ID, title: TAB_APPS });

  const values = [[
    app.firstname, app.lastname, app.email,
    app.classYear, app.photoUrl || "", app.resumeUrl || "",
    app.opt1 || "",
  ]];

  try {
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TAB_APPS}!A:G`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values },
    });

    const upd = res.data?.updates || {};
    console.log("[Sheets] OK", {
      tab: TAB_APPS,
      updatedRange: upd.updatedRange,
      updatedCells: upd.updatedCells,
      row: {
        firstname: app.firstname, lastname: app.lastname, email: app.email,
        classYear: app.classYear, photoUrl: app.photoUrl || "",
        resumeUrl: app.resumeUrl || "", opt1: app.opt1 || ""
      },
    });
    return res.data;
  } catch (e) {
    console.error("[Sheets] ERROR appendApplicationRow:", errMsg(e));
    throw e;
  }
}

// ---- PNM ID cache (column A) ----
let _pnmMaxId = null;         // number | null
let _pnmMaxIdCheckedAt = 0;
const ID_CACHE_MS = 5 * 60 * 1000; // 5 minutes

function parseIntSafe(v) {
  const n = parseInt(String(v).trim(), 10);
  return Number.isFinite(n) ? n : null;
}

async function getNextPnmId() {
  const now = Date.now();
  if (_pnmMaxId !== null && (now - _pnmMaxIdCheckedAt) < ID_CACHE_MS) {
    return _pnmMaxId + 1;
  }

  const sheets = getSheets();
  await ensureSheet({ spreadsheetId: SPREADSHEET_ID, title: TAB_PNMS });

  // Read all of column A (PNM ID). First row may be a header; we ignore non-numeric.
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${TAB_PNMS}!A:A`,
  });
  const rows = resp.data.values || [];
  let maxId = 0;
  for (const r of rows) {
    const val = r?.[0];
    const n = parseIntSafe(val);
    if (n !== null && n > maxId) maxId = n;
  }

  _pnmMaxId = maxId;
  _pnmMaxIdCheckedAt = now;
  return maxId + 1;
}

export async function appendToPNMsIfMissing({ name, email, year, photoUrl }) {
  const key = String(email || "").trim().toLowerCase();
  if (!key) return { skipped: true, reason: "no email" };

  const seen = await getPnmEmailSet();
  if (seen.has(key)) {
    console.log("[Sheets] PNMs: skip duplicate", key);
    return { skipped: true, reason: "duplicate" };
  }

  const sheets = getSheets();
  await ensureSheet({ spreadsheetId: SPREADSHEET_ID, title: TAB_PNMS });

  // 👇 assign the next numeric ID based on the current max in column A
  const nextId = await getNextPnmId();

  const row = [nextId, name || "", email || "", String(year || ""), photoUrl || ""];
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${TAB_PNMS}!A:E`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });

  // keep in-memory caches fresh
  seen.add(key);
  _pnmMaxId = Math.max(_pnmMaxId ?? 0, nextId);

  console.log("[Sheets] PNMs: appended", email, "as ID", nextId);
  return { appended: true, id: nextId };
}

// server/integrations/sheets.js (append at bottom or near other exports)
const TAB_PNMS = process.env.GSHEET_TAB_PNMS || "PNMs";

export async function appendPnmRowWithId({ id, name, email, year, photoUrl }) {
  const sheets = getSheets();
  await ensureSheet({ spreadsheetId: SPREADSHEET_ID, title: TAB_PNMS });

  const row = [id, name || "", (email || "").toLowerCase(), String(year || ""), photoUrl || ""];
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${TAB_PNMS}!A:E`, // PNM ID | PNM Name | Email | Year | Link to photo
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
  console.log("[Sheets] PNMs: appended", email, "as ID", id);
}

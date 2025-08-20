// server/integrations/appsheet.js
import fetch from "node-fetch";

const { APPSHEET_APP_ID, APPSHEET_API_KEY, APPSHEET_TABLE } = process.env;

const APPSHEET_URL =
  `https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/${encodeURIComponent(APPSHEET_TABLE)}/Action`;

/**
 * Sends one new row to AppSheet.
 * row = { FirstName, LastName, Email, Headshot }
 */
export async function appsheetAddRow(row) {
    console.log("[AppSheet] Row being sent:", row);   // <--- add this

  if (!APPSHEET_APP_ID || !APPSHEET_API_KEY || !APPSHEET_TABLE) {
    console.warn("AppSheet env not configured; skipping push.");
    return;
  }

  const body = {
    Action: "Add",
    Properties: { Locale: "en-US" },
    Rows: [row],
  };

  const res = await fetch(APPSHEET_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ApplicationAccessKey": APPSHEET_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`AppSheet push failed: ${res.status} ${text}`);
    err.status = res.status;
    throw err;
  }
}

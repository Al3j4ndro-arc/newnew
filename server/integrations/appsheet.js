// server/integrations/appsheet.js
import fetch from "node-fetch";

const {
  APPSHEET_APP_ID,
  APPSHEET_API_KEY,
  APPSHEET_TABLE,            // keep consistent with your envs
  APPSHEET_TIMEOUT_MS        // optional, e.g. "10000"
} = process.env;

const APPSHEET_URL = `https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/${encodeURIComponent(APPSHEET_TABLE)}/Action`;

// default to 10s if not provided
const TIMEOUT_MS = Number(APPSHEET_TIMEOUT_MS || 10000);

/**
 * Sends one new row to AppSheet.
 * `row` must use column names that match your AppSheet table exactly.
 */
export async function appsheetAddRow(row) {
  // Helpful breadcrumb in logs
  console.log("[AppSheet] start POST", {
    url: APPSHEET_URL,
    timeoutMs: TIMEOUT_MS,
    preview: {
      // don't dump secrets
      table: APPSHEET_TABLE,
      keys: Object.keys(row || {})
    }
  });

  if (!APPSHEET_APP_ID || !APPSHEET_API_KEY || !APPSHEET_TABLE) {
    console.warn("[AppSheet] env not configured; skipping push.");
    return;
  }

  const body = {
    Action: "Add",
    Properties: { Locale: "en-US" },
    Rows: [row],
  };

  // 10s timeout (or APPSHEET_TIMEOUT_MS)
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(APPSHEET_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ApplicationAccessKey": APPSHEET_API_KEY,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);

    console.log("[AppSheet] response", res.status);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      // Log compact error and throw a rich one
      console.error("[AppSheet] non-200", res.status, text?.slice?.(0, 400));
      const err = new Error(`AppSheet ${res.status}: ${text}`);
      err.status = res.status;
      throw err;
    }

    // (optional) If AppSheet returns JSON you care about:
    // const data = await res.json().catch(() => null);
    // console.log("[AppSheet] ok", data);
  } catch (e) {
    clearTimeout(timer);
    if (e.name === "AbortError") {
      console.error("[AppSheet] timed out after", TIMEOUT_MS, "ms");
      throw new Error(`AppSheet request timed out after ${TIMEOUT_MS} ms`);
    }
    console.error("[AppSheet] error:", e.message);
    throw e;
  }
}

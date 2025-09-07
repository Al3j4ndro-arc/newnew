// server/integrations/appsheet.js
const {
  APPSHEET_APP_ID,
  APPSHEET_API_KEY,    // make sure your .env uses this exact name
  APPSHEET_TABLE,
  APPSHEET_TIMEOUT_MS
} = process.env;

const APPSHEET_URL =
  `https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/${encodeURIComponent(APPSHEET_TABLE)}/Action`;
const TIMEOUT_MS = Number(APPSHEET_TIMEOUT_MS || 10000);

export async function appsheetAddRow(row) {
  if (!APPSHEET_APP_ID || !APPSHEET_API_KEY || !APPSHEET_TABLE) {
    console.warn("[AppSheet] env not configured; skipping push.", {
      hasAppId: !!APPSHEET_APP_ID, hasKey: !!APPSHEET_API_KEY, hasTable: !!APPSHEET_TABLE
    });
    return { skipped: true };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const body = { Action: "Add", Properties: { Locale: "en-US" }, Rows: [row] };

  try {
    const res = await fetch(APPSHEET_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ApplicationAccessKey": APPSHEET_API_KEY,  // correct header
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const raw = await res.text();              // <-- always read the body once
    let data = null; try { data = raw ? JSON.parse(raw) : null; } catch {}

    if (!res.ok) {
      console.error("[AppSheet] non-OK", res.status, raw?.slice?.(0, 400));
      throw new Error(`AppSheet ${res.status}: ${raw || "(no body)"}`);
    }
    if (data?.Errors?.length) {
      console.error("[AppSheet] logical errors:", data.Errors);
      throw new Error(`AppSheet reported errors: ${JSON.stringify(data.Errors)}`);
    }

    console.log("[AppSheet] OK", data || raw);
    return data || raw;
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

// add below appsheetAddRow()

/**
 * Update an existing row in AppSheet.
 * Your table must have a Key column (e.g., Email) included in the row payload.
 */
export async function appsheetEditRow(row) {
  if (!APPSHEET_APP_ID || !APPSHEET_API_KEY || !APPSHEET_TABLE) {
    console.warn("[AppSheet] env not configured; skipping EDIT.");
    return;
  }

  // If the payload has Email, use Selector so we’re not dependent on the table's Key setting
  const selector =
    row?.Email ? `Filter("${APPSHEET_TABLE}", [Email] = "${row.Email}")` : undefined;

  const body = {
    Action: "Edit",
    Properties: {
      Locale: "en-US",
      ...(selector ? { Selector: selector } : {}),
    },
    Rows: [row],
  };

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

    const raw = await res.text().catch(() => "");
    let data = null; try { data = raw ? JSON.parse(raw) : null; } catch {}

    if (!res.ok) {
      console.error("[AppSheet Edit] non-OK", res.status, raw?.slice?.(0, 400));
      throw new Error(`AppSheet Edit ${res.status}: ${raw}`);
    }
    if (data?.Errors?.length) {
      console.error("[AppSheet Edit] logical errors:", data.Errors);
      throw new Error(`AppSheet Edit errors: ${JSON.stringify(data.Errors)}`);
    }

    console.log("[AppSheet Edit] OK");
  } catch (e) {
    clearTimeout(timer);
    if (e.name === "AbortError") {
      console.error("[AppSheet Edit] timed out after", TIMEOUT_MS, "ms");
      throw new Error(`AppSheet Edit timed out after ${TIMEOUT_MS} ms`);
    }
    console.error("[AppSheet Edit] error:", e.message);
    throw e;
  }
}

export async function appsheetEditPhotoByEmail(email, photoUrl) {
  if (!APPSHEET_APP_ID || !APPSHEET_API_KEY || !APPSHEET_TABLE) {
    console.warn("[AppSheet] env not configured; skipping edit.");
    return;
  }

  const body = {
    Action: "Edit",
    Properties: {
      Locale: "en-US",
      // Use a selector to target rows by Email (assuming Email is your Key or is unique)
      Selector: `Filter("${APPSHEET_TABLE}", [Email] = "${email}")`,
    },
    Rows: [{ Photo: photoUrl }],
  };

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

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`AppSheet Edit ${res.status}: ${text}`);
    }
  } catch (e) {
    clearTimeout(timer);
    console.error("[AppSheet] edit error:", e.message);
    // don’t throw — user experience shouldn’t break on a sync hiccup
  }
}

// upsert: Add, and if it already exists, Edit it by Email
// server/integrations/appsheet.js
export async function appsheetUpsertRow(row) {
  try {
    await appsheetAddRow(row);
  } catch (e) {
    const msg = String(e?.message || "");
    // AppSheet returns 400 on duplicate key; treat as “already exists”
    if (/already exists|duplicate|key|400|409/i.test(msg)) {
      await appsheetEditByEmail(row.Email, row);   // <-- edit full payload
      return;
    }
    throw e;
  }
}

// Edit arbitrary fields for the row identified by Email.
// Use this if Email is NOT the Key column in AppSheet.
export async function appsheetEditByEmail(email, patch) {
  if (!APPSHEET_APP_ID || !APPSHEET_API_KEY || !APPSHEET_TABLE) {
    console.warn("[AppSheet] env not configured; skipping edit-by-email.");
    return;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const body = {
    Action: "Edit",
    Properties: {
      Locale: "en-US",
      Selector: `Filter("${APPSHEET_TABLE}", [Email] = "${email}")`,
    },
    Rows: [patch],
  };

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
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`AppSheet EditByEmail ${res.status}: ${text}`);
    }
  } catch (e) {
    clearTimeout(timer);
    console.error("[AppSheet EditByEmail] error:", e.message);
    throw e;
  }
}

/**
 * If Email IS your Key column (recommended), you can also use this:
 * It calls your generic appsheetEditRow(), passing Email in the row payload.
 */
export async function appsheetUpdateRow(rowWithEmail) {
  // rowWithEmail must include { Email: "..." }
  return appsheetEditRow(rowWithEmail);
}

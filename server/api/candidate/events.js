// server/api/candidate/events.js
import express from "express";
import verifyToken from "../utils/token.js";
import { Config, User } from "../../db/database.js";
import { appsheetUpsertRow } from "../../integrations/appsheet.js";
import { appendPnmRowWithId } from "../../integrations/sheet.js";
import { getNextPnmIdAtomic, claimPnmEmailOnce } from "../../integrations/pnmids.js";

const router = express.Router();
const ID_ALIAS = { meettheteam: "hellomcg" };

router.post("/event-signin", verifyToken, async (req, res) => {
  try {
    const rawId = (req.body?.eventName || "").trim();
    const id = ID_ALIAS[rawId] || rawId;
    const { eventCode } = req.body || {};

    if (!id || !eventCode) {
      return res.status(400).json({ message: "missing required fields" });
    }

    const cfg = await Config.findOne();
    const expected = cfg?.configData?.[id];
    if (!expected) return res.status(400).json({ message: "invalid event id" });
    if (String(eventCode) !== String(expected)) {
      return res.status(400).json({ message: "invalid event code" });
    }

    const eventsMap = (req.user.userData && req.user.userData.events) || {};

    // Already checked in → idempotent success
    if (eventsMap[id]) {
      const count = Object.keys(eventsMap).length;
      await pushToAppSheet(req.user, eventsMap, count);
      return res.json({ message: "already checked in", count });
    }

    // Mark attendance in DynamoDB
    const newEvents = { ...eventsMap, [id]: true };
    await User.updateOne(
      { userid: req.user.userid },
      { $set: { "userData.events": newEvents } }
    );

    // Append to PNMs (append-only, dedup by email) — don't block on failures
    try {
      const justCheckedInNow = !eventsMap[id];
      if (justCheckedInNow) {
        const fullName = `${req.user.firstname || ""} ${req.user.lastname || ""}`.trim();
        const email = (req.user.email || "").toLowerCase();
        const year =
          req.user?.userData?.classYear ??
          req.user?.userData?.application?.classYear ??
          "";
        const photoUrl = req.user.internalHeadshotUrl || req.user.headshotUrl || "";

        // Dedup by email across concurrent requests
        const claimed = await claimPnmEmailOnce(email);
        if (claimed) {
          const newPnmId = await getNextPnmIdAtomic(); // atomic counter in Dynamo
          await appendPnmRowWithId({ id: newPnmId, name: fullName, email, year, photoUrl });
        } else {
          console.log("[Sheets] PNMs: duplicate sign-in skip for", email);
        }
      }
    } catch (e) {
      console.warn("[Sheets] PNMs append skipped:", e?.message || e);
    }

    // Keep AppSheet in sync
    const count = Object.keys(newEvents).length;
    await pushToAppSheet(req.user, newEvents, count);

    return res.json({ message: "event code saved to database", count });
  } catch (err) {
    console.error("[event-signin] error:", err);
    return res.status(500).json({ message: "internal error" });
  }
});

async function pushToAppSheet(user, eventsMap, count) {
  const eventsList = Object.keys(eventsMap).sort().join(", ");
  const row = {
    Email: user.email,
    FirstName: user.firstname,
    LastName: user.lastname,
    Photo: user.internalHeadshotUrl || user.headshotUrl || "",
    EventsAttended: eventsList,
    NumEventsAttended: count,
  };
  try {
    await appsheetUpsertRow(row);
  } catch (e) {
    console.warn("[AppSheet upsert]", e?.message || e);
  }
}

export default router;

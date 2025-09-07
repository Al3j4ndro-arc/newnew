// server/api/dev.js
import express from "express";
import verifyToken from "./utils/token.js";
import { User, Config } from "../db/database.js";
import { appsheetUpsertRow } from "../integrations/appsheet.js";

const router = express.Router();

// Optional: lock to admins only
const adminOnly = (req, res, next) => {
  if (process.env.NODE_ENV === "production" && req.user?.usertype !== "admin") {
    return res.status(403).json({ message: "forbidden" });
  }
  next();
};

router.use(verifyToken);
router.use(adminOnly);

/**
 * POST /api/dev/clear-events
 * Body: { email?: string }
 * If email omitted, clears the currently logged-in user.
 */
router.post("/clear-events", async (req, res) => {
  try {
    const email = (req.body?.email || req.user?.email || "").trim();
    if (!email) return res.status(400).json({ message: "missing email" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "user not found" });

    await User.updateOne({ userid: user.userid }, { $set: { "userData.events": {} } });

    // sync AppSheet (best-effort)
    try {
      await appsheetUpsertRow({
        Email: email,
        FirstName: user.firstname,
        LastName:  user.lastname,
        Photo:     user.internalHeadshotUrl || user.headshotUrl || "",
        EventsAttended: "",
        NumEventsAttended: 0,
      });
    } catch (e) {
      console.warn("[dev/clear-events] appsheet upsert failed:", e?.message || e);
    }

    res.json({ ok: true });
  } catch (e) {
    console.error("[dev/clear-events] error:", e);
    res.status(500).json({ message: "failed" });
  }
});

/**
 * POST /api/dev/seed-event-codes
 * Seeds a known set of event codes into Config.
 */
router.post("/seed-event-codes", async (_req, res) => {
  try {
    const codes = {
      hellomcg: "hellomcg",
      careerday: "careerday",
      allvoices: "allvoices",
      resume_glowup: "resume_glowup",
      dessert: "dessert",
      caseprep: "caseprep",
    };
    await Config.upsert({ configType: "eventCodes", configData: codes });
    res.json({ ok: true, codes });
  } catch (e) {
    console.error("[dev/seed-event-codes] error:", e);
    res.status(500).json({ message: "failed" });
  }
});

export default router;

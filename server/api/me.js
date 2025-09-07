// server/api/me.js
import express from "express";
// FIX PATH:
import verifyToken from "./utils/token.js";
// FIX PATH:
import { User } from "../db/database.js";
// FIX PATH:
import { appsheetEditPhotoByEmail, appsheetUpsertRow, appsheetUpdateRow } from "../integrations/appsheet.js";

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  const {
    firstname,
    lastname,
    email,
    usertype,
    conflict,
    headshotUrl = null,
    userData: rawUserData = {},
  } = req.user || {};

  const userData = {};
  if (rawUserData?.events)       userData.events      = rawUserData.events;
  if (rawUserData?.application)  userData.application = rawUserData.application;

  // NEW: derive classYear + hasHeadshot for the client
  const classYear =
    rawUserData?.classYear ??
    rawUserData?.application?.classYear ??
    null;

  const internalHeadshot = req.user.internalHeadshotUrl || null;
  const hasHeadshot = Boolean(internalHeadshot || headshotUrl || rawUserData.headshotUrl);

  res.status(200).json({
    message: "success",
    data: {
      firstname,
      lastname,
      email,
      usertype,
      conflict,
      headshot: internalHeadshot || headshotUrl || rawUserData.headshotUrl || null,
      internalHeadshot,              // keep for convenience
      classYear,                     // <-- add
      hasHeadshot,                   // <-- add (client can decide if photo is required)
      userData,
    },
  });
});

// keep your existing headshot endpoint
router.post("/internal-headshot", verifyToken, async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ message: "missing url" });

  const updates = { internalHeadshotUrl: url, onboardingCompleteAt: Date.now() };

  try {
    const key = { userid: req.user.userid };
    if (typeof User.update === "function") {
      await User.update(key, updates);
    } else if (typeof User.findOneAndUpdate === "function") {
      await User.findOneAndUpdate(key, { $set: updates });
    } else if (typeof User.put === "function") {
      await User.put({ ...req.user, ...updates });
    }

    setImmediate(() => {
      appsheetEditPhotoByEmail(req.user.email, url).catch(() => {});
    });

    return res.json({ message: "ok", internalHeadshotUrl: url });
  } catch (e) {
    console.error("save internal headshot error:", e);
    return res.status(500).json({ message: "failed to save headshot" });
  }
});

// ⭐ NEW: save profile bits (classYear today; easy to extend later)
router.patch("/profile", verifyToken, async (req, res) => {
  const classYear = String(req.body?.classYear || "").trim();
  if (!/^\d{4}$/.test(classYear)) {
    return res.status(400).json({ message: "Invalid class year" });
  }
  await User.updateOne(
    { userid: req.user.userid },
    { $set: { "userData.classYear": classYear } }
  );
  // Best-effort AppSheet sync of ClassYear
     try {
       await appsheetUpdateRow({ Email: req.user.email, ClassYear: classYear });
     } catch (e) {
       console.warn("[AppSheet] classYear sync failed:", e.message);
     }
  res.json({ ok: true });
});

export default router;

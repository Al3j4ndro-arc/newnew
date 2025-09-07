import express from "express";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

import { User } from "../../db/database.js";
import verifyToken from "./token.js";
import { appsheetAddRow } from "../../integrations/appsheet.js";
import { appsheetUpsertRow } from "../../integrations/appsheet.js";

const router = express.Router();

// --- Google client (server-side verify of ID tokens) ---
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_ID', process.env.GOOGLE_CLIENT_ID);

// --- helpers ---
const hasRequiredSignup = (req) => {
  try {
    const { firstname, lastname, email, password } = req.body;
    if (!firstname?.trim() || !lastname?.trim() || !email?.trim() || !password?.trim()) return false;
  } catch {
    return false;
  }
  return true;
};

// normalize email once, use everywhere
const normalizeEmail = (e) => String(e || "").trim().toLowerCase();

async function ensureAppsheetSynced(user) {
  try {
    const photo = user.internalHeadshotUrl || user.headshotUrl || "";
    const classYear = user.userData?.classYear || user.userData?.application?.classYear || "";

    await appsheetUpsertRow({
      FirstName: user.firstname,
      LastName:  user.lastname,
      Email:     user.email,
      Photo:     photo,
      ...(classYear ? { ClassYear: String(classYear) } : {}),
    });

    // always mark (or refresh) the sync timestamp in your DB
    const patch = { appsheetSyncedAt: Date.now() };
    if (typeof User.update === "function") {
      await User.update({ userid: user.userid }, patch);
    } else if (typeof User.findOneAndUpdate === "function") {
      await User.findOneAndUpdate({ userid: user.userid }, { $set: patch });
    } else if (typeof User.put === "function") {
      await User.put({ ...user, ...patch });
    }

    console.log("[AppSheet] upserted", user.email);
  } catch (e) {
    console.error("[AppSheet] sync failed:", e.message);
  }
}

// --- SIGNUP (email/password, optional headshotUrl from S3) ---
// --- SIGNUP (email/password, optional headshotUrl from S3) ---
router.post("/signup", async (req, res) => {
  if (!hasRequiredSignup(req)) {
    return res.status(400).json({ message: "missing required fields" });
  }

  const { firstname, lastname, email, password, headshotUrl } = req.body;
  const emailNorm = normalizeEmail(email);

  const existing = await User.findOne({ email: emailNorm });
  if (existing) {
    return res.status(409).json({
      message: "email already signed up. Please contact emmachen@mit.edu if you think this is a mistake",
    });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const savedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      userid: uuidv4(),
      firstname,
      lastname,
      email: emailNorm,
      password: savedPassword,
      usertype: "candidate",
      headshotUrl: headshotUrl || null,
      userData: { feedback: [], events: {}, application: {} },
      decision: "pending",
      conflict: [],
    });

    // session
    const token = jwt.sign({ userid: user.userid }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // respond first so a sync hiccup never blocks signup
    res.json({ message: "ok" });

    // best-effort AppSheet sync (will no-op if already synced)
    setImmediate(() => ensureAppsheetSynced(user));

  } catch (err) {
    console.error("signup error:", err);
    return res.status(500).json({ message: "error creating user" });
  }
});

// --- LOGIN (email/password) ---
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  const emailNorm = normalizeEmail(email);

  if (!email || !password) return res.status(400).json({ message: "missing required fields" });

  const user = await User.findOne({ email: emailNorm });
  if (!user) return res.status(400).json({ message: "invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ message: "invalid credentials" });

  const token = jwt.sign(
    { userid: user.userid },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({ message: "login successful" });
});

// --- GOOGLE LOGIN ---
// --- GOOGLE LOGIN ---
router.post("/google", async (req, res) => {
  try {
    const { id_token } = req.body;
    if (!id_token) return res.status(400).json({ message: "Missing id_token" });

    const ticket = await googleClient.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const p = ticket.getPayload() || {};
    const { sub: googleId, email, email_verified, given_name, family_name, picture } = p;

    if (!email || !email_verified) {
      return res.status(401).json({ message: "Google email not verified" });
    }

    const emailNorm = normalizeEmail(email);

    // if (process.env.NODE_ENV === "production" && !/@mit\.edu$/i.test(email)) {
    //   return res.status(403).json({ message: "Please use your MIT email (@mit.edu)" });
    // }

    let user = await User.findOne({ email: emailNorm });
    if (!user) {
      user = await User.create({
        userid: uuidv4(),
        firstname: given_name || "",
        lastname:  family_name || "",
        email: emailNorm,
        googleId,
        usertype: "candidate",
        headshotUrl: picture || null,
        userData: { feedback: [], events: {}, application: {} },
        decision: "pending",
        conflict: [],
      });
    } else {
      const updates = {};
      if (!user.googleId) updates.googleId = googleId;
      if (picture && user.headshotUrl !== picture) updates.headshotUrl = picture;

      if (Object.keys(updates).length) {
        const key = { userid: user.userid }; // safer than email
        if (typeof User.update === "function") {
          await User.update(key, updates);
          user = { ...user, ...updates };
        } else if (typeof User.findOneAndUpdate === "function") {
          const opts = { new: true };
          user = (await User.findOneAndUpdate(key, { $set: updates }, opts)) || { ...user, ...updates };
        } else if (typeof User.put === "function") {
          await User.put({ ...user, ...updates });
          user = { ...user, ...updates };
        } else {
          console.warn("[auth/google] No update method; skipping persist for", key);
          user = { ...user, ...updates };
        }
      }
    }

    // session cookie
    const token = jwt.sign({ userid: user.userid }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // respond first
    res.json({ message: "ok" });

    // best-effort AppSheet sync on every login (no-ops if already synced)
    setImmediate(() => ensureAppsheetSynced(user));

  } catch (err) {
    console.error("google auth error:", err);
    return res.status(500).json({ message: "Google auth failed" });
  }
});

// server/api/utils/auth.js (or a dev router)
router.post("/dev/appsheet-test", async (req, res) => {
  try {
    const r = await appsheetAddRow({
      FirstName: "Test",
      LastName:  "User",
      Email:     `devtest+${Date.now()}@example.com`,
      Photo:     "",
    });
    res.json({ ok: true, r });
  } catch (e) {
    res.status(500).json({ ok: false, err: e.response?.data || e.message });
  }
});

// --- LOGOUT ---
router.post("/logout", (req, res) => {
  res.clearCookie("token", { path: "/" });
  res.status(200).json({ message: "logout successful" });
});

// --- REFRESH ---
router.post("/refresh-token", verifyToken, (req, res) => {
  const token = jwt.sign(
    { userid: req.user.userid },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.status(200).json({ message: "token refreshed" });
});

export default router;

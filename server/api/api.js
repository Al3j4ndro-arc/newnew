import express from "express";
import auth from "./utils/auth.js";
import events from "./candidate/events.js";
import application from "./candidate/application.js";
import me from "./me.js";
import admin from "./admin.js";
import feedback from "./member/feedback.js";
import conflict from "./member/conflict.js";
import uploads from "./uploads.js";
import dev from "./dev/config.js";
import devSheets from "./dev/sheets.js";

const router = express.Router();

// User authentication (signup, login, logout)
router.use("/auth", auth);

// Upload headshots
router.use("/uploads", uploads);

// Mount dev tools (only in non-prod)
if (process.env.NODE_ENV !== "production") {
  router.use("/dev", dev);
  router.use("/dev", devSheets);
}

// Event routes (sign into event)
router.use("/events", events);

// Application routes (submit application)
router.use("/application", application);

// User routes (get user data)
router.use("/me", me);

// Admin routes (set event codes)
router.use("/admin", admin);

// Feedback routes (submit feedback)
router.use("/feedback", feedback);

// Conflict routes (submit conflicts)
router.use("/conflict", conflict);

export default router;

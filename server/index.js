// server/index.js
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(bodyParser.json({ limit: "5mb" }));
app.use((err, req, res, next) => {
  if (err) return res.status(413).json({ message: "file too large, please upload a smaller profile picture/resume" });
  next();
});
app.use(cookieParser());

// --- JSON health FIRST ---
app.get("/healthz", (req, res) => {
  res.json({ ok: true, port: process.env.PORT || 3001, env: process.env.NODE_ENV || "production" });
});

// --- preview cookie route (optional) ---
const PUBLIC_LOCK   = String(process.env.PUBLIC_LOCK || "").toLowerCase() === "on";
const PREVIEW_KEY   = process.env.PREVIEW_KEY || "";
const PREVIEW_COOKIE = "mcg_preview_ok";

app.get("/preview", (req, res) => {
  if ((req.query.key || "") === PREVIEW_KEY) {
    res.cookie(PREVIEW_COOKIE, "yes", { httpOnly: true, sameSite: "lax", maxAge: 8 * 3600 * 1000 });
    return res.redirect("/");
  }
  return res.status(403).send("Invalid preview key");
});

// --- Maintenance gate (after /healthz) ---
app.use((req, res, next) => {
  if (!PUBLIC_LOCK) return next();
  if (req.path.startsWith("/healthz")) return next();      // allow /healthz and /healthz/

  // Allow header bypass
  const hdr = req.get("x-preview-key") || "";
  if (PREVIEW_KEY && hdr === PREVIEW_KEY) return next();

  if (req.path.startsWith("/api/")) {
    return res.status(503).json({ ok: false, message: "Applications are not open yet." });
  }
  res.sendFile(path.join(__dirname, "../client/public/maintenance.html"));
});

// --- API before static ---
import api from "./api/api.js";
app.use("/api", api);

// Static + SPA catch-all
app.use(express.static(path.join(__dirname, "../client/public/dist")));
// server.js
app.use(express.static(path.join(__dirname, "client/public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/public/dist/index.html"));
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server started on port: ${port}`));

// server/index.js
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";                // <-- add
import { dirname } from "path";                     // <-- add
import crypto from "crypto";

dotenv.config();

const app = express();

// If you're using native ES modules, define __dirname:
const __filename = fileURLToPath(import.meta.url);  // <-- add
const __dirname  = dirname(__filename);             // <-- add

app.use(
  helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false })
);

app.use(bodyParser.json({ limit: "5mb" }));

app.use((err, req, res, next) => {
  if (err) {
    return res.status(413).json({
      message: "file too large, please upload a smaller profile picture/resume",
    });
  }
  next();
});

app.use(cookieParser());


// cookie parser already present
// app.use(cookieParser());

const PUBLIC_LOCK   = process.env.PUBLIC_LOCK === "on";         // toggle
const PREVIEW_KEY   = process.env.PREVIEW_KEY || crypto.randomUUID();
const PREVIEW_COOKIE = "mcg_preview_ok";

// Route to unlock preview: /preview?key=YOUR_SECRET
app.get("/preview", (req, res) => {
  const { key } = req.query;
  if (String(key) === String(PREVIEW_KEY)) {
    // 8 hours preview
    res.cookie(PREVIEW_COOKIE, "yes", { httpOnly: true, sameSite: "lax", maxAge: 8 * 3600 * 1000 });
    return res.redirect("/");
  }
  return res.status(403).send("Invalid preview key");
});

// Maintenance gate: block all non-API/non-static unless preview cookie present
app.use((req, res, next) => {
  if (!PUBLIC_LOCK) return next();

  const hasPreview = req.cookies?.[PREVIEW_COOKIE] === "yes";

  // allow API and the preview route to work as usual
  if (
    hasPreview ||
    req.path.startsWith("/api") ||
    req.path.startsWith("/preview") ||
    req.path.startsWith("/assets") // if you serve static assets from a folder
  ) {
    return next();
  }

  // serve maintenance page
  res.sendFile(path.join(__dirname, "../client/public/maintenance.html"));
});

// --- API before static ---
import api from "./api/api.js";
app.use("/api", api);

// Health check (so curl works)
app.get("/healthz", (req, res) => {
  res.json({ ok: true, port: process.env.PORT || 3001 });
});

const port = process.env.PORT || 3001;

// Serve production build (adjust this path to your actual build output)
app.use(express.static(path.join(__dirname, "../client/public/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/public/dist/index.html"));
});

app.listen(port, () => console.log(`Server started on port: ${port}`)); // <-- fix log

import express from "express";
import verifyToken from "../utils/token.js";
import { User } from "../../db/database.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { appsheetUpdateRow, appsheetUpsertRow } from "../../integrations/appsheet.js";
// import { appendRow } from "../../integrations/sheet.js";

const router = express.Router();

const REGION   = process.env.AWS_REGION || "us-east-2";
const BUCKET   = process.env.S3_BUCKET;
const CF_DOMAIN = process.env.CLOUDFRONT_DOMAIN;
const BASE_URL = process.env.PUBLIC_BASE_URL || "http://localhost:8080";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const TAB_APP = process.env.GSHEET_TAB_APPLICATION || "Application Submissions";

// ~290 KB leaves room for other attributes in the same DynamoDB item
const MAX_INLINE_BYTES = 290 * 1024;

const s3 = new S3Client({ region: REGION });

function parseDataUrl(dataUrl) {
  const [meta, b64] = String(dataUrl || "").split(",");
  if (!b64) throw new Error("bad data URL");
  const m = /^data:(.*?);base64$/.exec(meta || "");
  const contentType = (m && m[1]) || "application/octet-stream";
  // ext guess
  let ext = "bin";
  if (contentType.endsWith("pdf")) ext = "pdf";
  else if (contentType.endsWith("msword")) ext = "doc";
  else if (contentType.includes("officedocument.wordprocessingml.document")) ext = "docx";
  return { contentType, base64: b64, ext };
}

function approxBytesFromBase64(b64) {
  // 4 chars -> 3 bytes; ignore padding for rough size
  return Math.floor((b64.length * 3) / 4);
}

async function putToS3(buffer, contentType, key) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType, ContentDisposition: "inline"
  }));
  return key;
}

const cfUrlFor = (key) =>
  CF_DOMAIN ? `https://${CF_DOMAIN}/${key}` :
  `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

// GET handler can stay as you had it; below is the POST:
// server/api/application.js
// server/api/application.js
router.post("/submit-application", verifyToken, async (req, res) => {
  try {
    const { classYear, profileImg, resume, opt1, email: bodyEmailRaw } = req.body || {};
    if (!classYear || !resume) {
      return res.status(400).json({ message: "Class year and resume are required." });
    }
    if (!/^\d{4}$/.test(String(classYear))) {
      return res.status(400).json({ message: "Please enter a valid class year (e.g., 2027)." });
    }

    // Choose which MIT email we’ll use (MIT login or user-typed MIT)
    const loginEmail = (req.user?.email || "").trim().toLowerCase();
    const bodyEmail  = (bodyEmailRaw || "").trim().toLowerCase();

    let effectiveEmail = "";
    if (/@mit\.edu$/i.test(loginEmail)) {
      effectiveEmail = loginEmail;                 // logged in with MIT
    } else {
      if (!/@mit\.edu$/i.test(bodyEmail)) {
        return res.status(400).json({ message: "Please provide an @mit.edu email" });
      }
      effectiveEmail = bodyEmail;                  // supplied MIT
    }

    // Profile image: required only if user doesn’t have one yet; overwrite if provided
    let internalHeadshotUrl = req.user.internalHeadshotUrl || null;
    if (!internalHeadshotUrl && !profileImg) {
      return res.status(400).json({ message: "Please upload a profile image." });
    }
    if (profileImg) {
      const img = parseDataUrl(profileImg);
      const headshotKey = `internal-headshots/${req.user.userid}-${Date.now()}.${img.ext}`;
      const imgBuf = Buffer.from(img.base64, "base64");
      await putToS3(imgBuf, img.contentType, headshotKey);
      internalHeadshotUrl = cfUrlFor(headshotKey);
    }

    // Resume: inline if small (<= MAX_INLINE_BYTES), else S3
    // Resume: inline if small, else S3 + URL
    const r = parseDataUrl(resume);
    const rBytes = approxBytesFromBase64(r.base64);

    let applicationRecord = {
    classYear,
    opt1: opt1 || "",
    submittedAt: Date.now(),
    };

    let resumeUrlForAppSheet;

    if (rBytes <= MAX_INLINE_BYTES) {
    // keep small files inline; AppSheet gets the proxy URL
    applicationRecord.resume = resume;
    applicationRecord.resumeStorage = "inline";
    resumeUrlForAppSheet =
        `${BASE_URL}/api/admin/candidate-resume/${encodeURIComponent(effectiveEmail)}`;
    } else {
    const key = `resumes/${req.user.userid}-${Date.now()}.${r.ext}`;
    await putToS3(Buffer.from(r.base64, "base64"), r.contentType, key);

    // <<< add these 3 lines for PUBLIC S3 URLs
    const publicS3Url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
    applicationRecord.resumeUrl = publicS3Url;   // store on the user record
    resumeUrlForAppSheet = publicS3Url;          // send to AppSheet

    applicationRecord.resumeKey  = key;
    applicationRecord.resumeType = r.contentType;
    applicationRecord.resumeStorage = "s3";
    }

    // Persist to Dynamo
    await User.updateOne(
      { userid: req.user.userid },
      { $set: { internalHeadshotUrl, "userData.application": applicationRecord } }
    );

    // Push to AppSheet — row keyed by MIT email
    const patch = {
      Email: effectiveEmail,
      ClassYear: String(classYear),
      OptionalResponse: opt1 || "",
      ResumeUrl: resumeUrlForAppSheet,
    };

    try {
      await appsheetUpdateRow(patch);
    } catch {
      await appsheetUpsertRow({
        FirstName: req.user.firstname,
        LastName:  req.user.lastname,
        Email:     effectiveEmail,
        Photo:     internalHeadshotUrl || req.user.headshotUrl || "",
        ...patch,
      });
    }

    try {
        const first = req.user.firstname || "";
        const last  = req.user.lastname || "";
        const email = effectiveEmail; // the MIT email picked earlier
        const year  = String(classYear || "");
        const head  = internalHeadshotUrl || req.user.headshotUrl || "";
        const resumeUrl = resumeUrlForAppSheet; // either proxy link or public S3/CF url
        const response  = opt1 || "";

        await appendRow({
            spreadsheetId: SPREADSHEET_ID,
            title: TAB_APP,
            values: [first, last, email, year, head, resumeUrl, response],
        });
        } catch (e) {
        console.warn("[Sheets] application append failed:", e.message);
        }

    res.json({ ok: true, message: "Application submitted." });
  } catch (e) {
    console.error("[submit-application] error:", e);
    res.status(500).json({ message: "Error submitting application." });
  }
});

export default router;

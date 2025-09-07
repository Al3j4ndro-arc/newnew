// server/api/uploads.js
import express from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import verifyToken from "./utils/token.js";

const router = express.Router();

const REGION = process.env.AWS_REGION || "us-east-2";
const BUCKET = process.env.S3_BUCKET; // e.g., mcg-apps-data

const CDN =
  process.env.CDN_PUBLIC_BASE ||               // e.g. https://dxxxx.cloudfront.net
  (process.env.CLOUDFRONT_DOMAIN
    ? `https://${process.env.CLOUDFRONT_DOMAIN}`
    : `https://${BUCKET}.s3.${REGION}.amazonaws.com`);

const s3 = new S3Client({ region: REGION });

router.post("/headshot-url", async (req, res) => {
  try {
    const { contentType } = req.body || {};
    if (!contentType) return res.status(400).json({ message: "contentType required" });

    const ext = (contentType.split("/")[1] || "jpg").toLowerCase();
    const key = `headshots/${uuidv4()}-${Date.now()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      // Do not set ACL if bucket has ACLs disabled.
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
    const fileUrl = `${CDN}/${key}`;
    res.json({ uploadUrl, fileUrl, key });
  } catch (e) {
    console.error("presign error:", e);
    res.status(500).json({ message: "could not create upload URL" });
  }
});

/**
 * Protected presign for *internal* headshot during onboarding (authenticated).
 * Returns { uploadUrl, fileUrl } for internal-headshots/...
 */
router.post("/internal-headshot-url", verifyToken, async (req, res) => {
  try {
    const { contentType = "image/png" } = req.body || {};
    const ext = (contentType.split("/")[1] || "png").toLowerCase();
    const key = `internal-headshots/${req.user.userid}-${Date.now()}.${ext}`;

    const putCmd = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, putCmd, { expiresIn: 60 * 5 });
    const fileUrl = `${CDN}/${key}`;
    res.json({ uploadUrl, fileUrl, key });
  } catch (e) {
    console.error("presign error:", e);
    res.status(500).json({ message: "presign failed" });
  }
});

export default router;

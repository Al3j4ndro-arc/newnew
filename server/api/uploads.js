// server/api/uploads.js
import express from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

const REGION = process.env.AWS_REGION || "us-east-2";
const BUCKET = process.env.S3_BUCKET; // e.g., mcg-apps-data

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
      // ❌ DO NOT set ACL when bucket has ACLs disabled:
      // ACL: "public-read",
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
    const fileUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

    res.json({ uploadUrl, fileUrl });
  } catch (e) {
    console.error("presign error:", e);
    res.status(500).json({ message: "could not create upload URL" });
  }
});

export default router;

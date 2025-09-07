// server/api/utils/token.js
import jwt from "jsonwebtoken";
import { User } from "../../db/database.js";

const JWT_SECRET = process.env.JWT_SECRET;

export default async function verifyToken(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: "no token provided" });
    }

    let payload;
    try {
      // sync form throws on error
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (process.env.DEBUG_AUTH === "1") {
        console.error("[verifyToken] jwt.verify error:", err.message);
      }
      return res.status(401).json({ message: "invalid token" });
    }

    const userId = payload.userid || payload.id; // be tolerant
    if (!userId) {
      return res.status(401).json({ message: "invalid token payload" });
    }

    const user = await User.findOne({ userid: userId });
    if (!user) {
      return res.status(401).json({ message: "user not found" });
    }

    if (process.env.DEBUG_AUTH === "1") {
      console.log("[verifyToken] OK for:", user.email, "headshotUrl:", user.headshotUrl);
    }

    req.user = user; // full user doc for downstream routes
    return next();
  } catch (e) {
    console.error("[verifyToken] unexpected error:", e);
    return res.status(401).json({ message: "invalid token" });
  }
}

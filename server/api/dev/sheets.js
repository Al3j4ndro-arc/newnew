import express from "express";

const router = express.Router();

import { appendEventSigninRow } from "../../integrations/sheet.js";

router.post("/sheets-test", async (req, res) => {
  try {
    await appendEventSigninRow({
      name: "Test User",
      email: "test@example.com",
      year: "2029",
      photoUrl: "https://example.com/photo.jpg",
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;

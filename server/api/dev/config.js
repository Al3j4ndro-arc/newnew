// server/api/dev/config.js (dev-only)
import express from "express";
import { Config } from "../../db/database.js";
const router = express.Router();

router.post("/seed-event-codes", async (_req, res) => {
  await Config.upsert({
    configType: "eventCodes",
    configData: {
      // keys MUST match your frontend event ids (the `id` prop used by Event cards)
      hellomcg :     "hellomcg",
      careerday:     "careerday",
      allvoices:     "allvoices",
      resume_glowup: "resume_glowup",
      dessert:       "dessert",
      caseprep:      "caseprep"
    },
  });
  res.json({ ok: true });
});

export default router;

import express from "express";
import bcrypt from "bcrypt";

const router = express.Router();
import { Config, User } from "../db/database.js";
import verifyToken from "./utils/token.js";

import { appsheetUpdateRow } from "../integrations/appsheet.js"; // add this at top with your other imports
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-2" });
const normalizeEmail = (s="") => String(s).trim().toLowerCase();

const isAdminMiddleware = (req, res, next) => {
    if (req.user.usertype != "admin") {
        res.status(401).json({
            message: "unauthorized",
        });
        return;
    }
    next();
};

const S3_BUCKET =
  process.env.S3_BUCKET ||
  process.env.AWS_S3_BUCKET ||
  process.env.MCG_S3_BUCKET ||
  process.env.S3_BUCKET_NAME || "";

router.use(verifyToken);
router.use(isAdminMiddleware);

router.post("/set-event-code", async (req, res) => {
  const { eventName, eventCode } = req.body || {};
  if (!eventName || !eventCode) {
    return res.status(400).json({ message: "missing required fields" });
  }

  const current = await Config.findOne();
  const nextCodes = { ...(current?.configData || {}), [eventName]: eventCode };

  await Config.upsert({
    configType: "eventCodes",
    configData: nextCodes,
  });

  return res.status(200).json({ message: "event code saved to database" });
});

router.post("/set-decision", async (req, res) => {
    User.findOne({ email: req.body.email }).then(async (candidate) => {
        if (!candidate) {
            res.status(500).json({
                message: "error finding candidate in database",
            });
        } else {
            candidate.decision = req.body.decision;
            candidate.markModified("decision");
            candidate
                .save()
                .then(() => {
                    res.status(200).json({
                        message: "decision submitted",
                    });
                })
                .catch((err) => {
                    res.status(500).json({
                        message: "error saving decision to database",
                    });
                });
        }
    });
});

router.get("/get-event-codes", async (req, res) => {
  const cfg = await Config.findOne();
  return res.status(200).json({
    message: cfg ? "event codes found in database" : "no event codes in database",
    eventCodes: cfg?.configData || {},
  });
});

router.get("/view-all-candidates", async (req, res) => {
    // gets all users with decision pending
    User.find({ usertype: "candidate" })
        .then((candidates) => {
            if (!candidates) {
                res.status(500).json({
                    message: "error finding candidates in database",
                });
            } else {
                res.status(200).json({
                    message: "candidates found in database",
                    candidates: candidates,
                });
            }
        })
        .catch((err) => {
            res.status(500).json({
                message: "error finding candidates in database",
            });
        });
});

router.get("/get-candidates-type/:decision", async (req, res) => {
    // gets all users with given decision
    User.find({ usertype: "candidate", decision: req.params.decision })
        .then((candidates) => {
            if (!candidates) {
                res.status(500).json({
                    message: "error finding candidates in database",
                });
            } else {
                res.status(200).json({
                    message: "candidates found in database",
                    candidates: candidates,
                });
            }
        })
        .catch((err) => {
            res.status(500).json({
                message: "error finding candidates in database",
            });
        });
});

router.get("/view-applied-candidates", async (req, res) => {
    User.find({ usertype: "candidate", applied: true })
        .then((candidates) => {
            if (!candidates) {
                res.status(500).json({
                    message: "error finding candidates in database",
                });
            } else {
                res.status(200).json({
                    message: "candidates found in database",
                    candidates: candidates,
                });
            }
        })
        .catch((err) => {
            res.status(500).json({
                message: "error finding candidates in database",
            });
        });
});

router.get("/get-unassigned", async (req, res) => {
    User.find({ email: "test@mit.edu" })
        .then((candidate) => {
            if (!candidate) {
                res.status(500).json({
                    message: "error finding candidate in database",
                });
            } else {
                if (!candidate.userData) {
                    res.status(500).json({
                        message: "error finding candidate in database",
                    });
                }
                res.status(200).json({
                    message: "candidate found in database",
                    feedback: candidate.userData.feedback,
                });
            }
        })
});

router.get("/candidate-info/:userid", async (req, res) => {
    User.findOne({ userid: req.params.userid })
        .then((candidate) => {
            if (!candidate) {
                res.status(500).json({
                    message: "error finding candidate in database",
                });
            } else {
                if (!candidate.userData) {
                    res.status(500).json({
                        message: "error finding candidate in database",
                    });
                }
                res.status(200).json({
                    message: "candidate found in database",
                    candidate: candidate,
                });
            }
        })
});

async function findCandidateByAnyEmail(raw) {
  const email = normalizeEmail(decodeURIComponent(raw || ""));
//   if (!email) return null;
  return (
    await User.findOne({ email }) ||
    await User.findOne({ "userData.application.email": email })
  );
}

async function sendResumeForUser(user, res) {
  const app = user?.userData?.application || {};

  if (app.resumeUrl && /^https?:\/\//i.test(app.resumeUrl)) {
    res.setHeader("Cache-Control", "private, no-store");
    return res.redirect(app.resumeUrl);
  }
  if (typeof app.resume === "string" && app.resume.startsWith("data:")) {
    const [meta, b64] = app.resume.split(",", 2);
    const mime = (/^data:([^;]+)/.exec(meta)?.[1]) || "application/pdf";
    const buf = Buffer.from(b64 || "", "base64");
    const filename = `${(user.firstname || "resume").replace(/[^a-z0-9_.-]+/gi,"_")}.pdf`;
    res.setHeader("Content-Type", mime);
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Cache-Control", "private, no-store");
    return res.send(buf);
  }
  // (optional) S3 presign branch if you later store {bucket,key}
  return res.status(404).json({ message: "resume not uploaded" });
}

// GET by email (tolerant of MIT vs login email)
router.get("/candidate-resume/:email", async (req, res) => {
  console.log("[admin] resume v2 path hit:", req.params.email);
  try {
    const user = await findCandidateByAnyEmail(req.params.email);
    if (!user) return res.status(404).json({ message: "user not found" });
    return await sendResumeForUser(user, res);
  } catch (e) {
    console.error("[admin/candidate-resume] error:", e);
    return res.status(500).json({ message: "internal error" });
  }
});

router.get("/candidate-resume-id/:userid", async (req, res) => {
  console.log("[admin] resume v2 path hit:", req.params.email || req.params.userid);
  try {
    const user = await User.findOne({ userid: req.params.userid });
    if (!user) return res.status(404).json({ message: "user not found" });
    return sendResumeForUser(user, res);
  } catch (e) {
    console.error("[admin/candidate-resume-id] error:", e);
    return res.status(500).json({ message: "internal error" });
  }
});

router.get("/candidate-profile-img/:email", async (req, res) => {
  try {
    const user = await findCandidateByAnyEmail(req.params.email);
    if (!user) return res.status(404).json({ message: "user not found" });

    const app = user.userData?.application || {};
    const dataUri = app.profileImg;
    const url = user.internalHeadshotUrl || user.headshotUrl || "";

    if (typeof dataUri === "string" && dataUri.startsWith("data:")) {
      const [meta, b64] = dataUri.split(",", 2);
      const m = /^data:([^;]+)/.exec(meta);
      const mime = (m && m[1]) || "image/png";
      res.setHeader("Content-Type", mime);
      res.setHeader("Cache-Control", "private, no-store");
      return res.end(b64 || "", "base64");
    }
    if (/^https?:\/\//i.test(url)) {
      res.setHeader("Cache-Control", "private, no-store");
      return res.redirect(url);
    }
    return res.status(404).json({ message: "profile image not uploaded" });
  } catch (e) {
    console.error("[admin/candidate-profile-img] error:", e);
    return res.status(500).json({ message: "internal error" });
  }
});


router.get("/candidate-spreadsheet", async (req, res) => {
    User.find({ usertype: "candidate" })
        .then((candidates) => {
            if (!candidates) {
                res.status(500).json({
                    message: "error finding candidates in database",
                });
            } else {
                // Create a csv of all the candidates
                let csv = "First Name,Last Name,Email,Class Year,Meet the Team,DEI Panel,Resume Review,Cheesecake Social,Case Workshop,Resume,Profile,Hope to Gain,Past Experience\n";
                for (let i = 0; i < candidates.length; i++) {
                    let candidate = candidates[i];
                    let classYear = ""
                    let events = {}
                    if (!candidate || !candidate.userData || !candidate.userData.application) {
                        continue;
                    }
                    if (candidate.userData && candidate.userData.application) {
                        classYear = candidate.userData.application.classYear;
                    }
                    if (candidate.userData && candidate.userData.events) {
                        events = candidate.userData.events;
                    }
                    csv += candidate.firstname + "," + candidate.lastname + "," + candidate.email + "," + classYear + ",";
                    csv += (events.hellomcg ? "Yes" : "No") + "," + (events.careerday ? "Yes" : "No") + "," + (events.allvoices ? "Yes" : "No") + "," + (events.resume_glowup ? "Yes" : "No") + "," + (events.dessert ? "Yes" : "No") + "," + (events.caseprep ? "Yes" : "No") + ",";
                    csv += `https://applymcg.org/api/admin/candidate-resume-id/${candidate.userid}` + "," + `https://apply.mitconsulting.group/api/admin/candidate-profile-img/${candidate.email}` + ",";
                    // csv += candidate.userData.application.opt1.replaceAll(",", "-").replaceAll("\n", "") + "," + candidate.userData.application.opt2.replaceAll(",", "-").replaceAll("\n", "") + ",";
                    csv += "\n";
                }
                res.header("Content-Type", "text/csv");
                return res.end(csv);
            }
        })
        .catch((err) => {
            console.log(err)
            res.status(500).json({
                message: "error finding candidates in database",
            });
        });
});

router.get("/feedback-spreadsheet", async (req, res) => {
    User.find({ usertype: "candidate" })
        .then((candidates) => {
            if (!candidates) {
                res.status(500).json({
                    message: "error finding candidates in database",
                });
            } else {
                // Create a csv of all the candidates
                let csv = "First Name,Last Name,Email,Submitted By, Event, Comments, Commitment, Social, Challenge, Tact\n";
                for (let i = 0; i < candidates.length; i++) {
                    let candidate = candidates[i];
                    if (!candidate || !candidate.userData || !candidate.userData.feedback) {
                        continue;
                    }
                    for (let j = 0; j < candidate.userData.feedback.length; j++) {
                        let feedback = candidate.userData.feedback[j];
                        csv += candidate.firstname + "," + candidate.lastname + "," + candidate.email + "," + feedback.submittedBy + "," + feedback.event + "," + feedback.comments.replaceAll(",", "-").replaceAll("\n", "").replaceAll("=", "equals") + "," + feedback.commitment + "," + feedback.socialfit + "," + feedback.challenge + "," + feedback.tact + ",";
                        csv += "\n";
                    }
                }
                res.header("Content-Type", "text/csv");
                return res.end(csv);
            }
        })
        .catch((err) => {
            console.log(err)
            res.status(500).json({
                message: "error finding candidates in database",
            });
        });
});

// read current config
router.get("/config", verifyToken, async (req, res) => {
  // (optional) enforce admin: if (req.user.usertype !== "admin") return res.sendStatus(403);
  const cfg = await Config.findOne();
  res.json(cfg || {});
});

// upsert event codes
router.post("/event-codes", verifyToken, async (req, res) => {
  // (optional) enforce admin: if (req.user.usertype !== "admin") return res.sendStatus(403);
  const { codes } = req.body || {};
  if (!codes || typeof codes !== "object") return res.status(400).json({ message: "missing codes" });
  const item = await Config.upsert({ configType: "eventCodes", configData: codes });
  res.json({ ok: true, item });
});

router.post("/fix-user-events", verifyToken, isAdminMiddleware, async (req, res) => {
  try {
    const { email, userid, fromKey, toKey } = req.body || {};
    if (!(email || userid) || !fromKey || !toKey) {
      return res.status(400).json({ message: "missing fields: email|userid, fromKey, toKey" });
    }

    const user =
      email ? await User.findOne({ email }) : await User.findById(userid);

    if (!user) return res.status(404).json({ message: "user not found" });

    const events = { ...(user.userData?.events || {}) };

    if (!events[fromKey]) {
      return res.json({ message: "no-op (fromKey not present)", userid: user.userid, events });
    }

    // rename key
    events[toKey] = true;
    delete events[fromKey];

    await User.updateOne(
      { userid: user.userid },
      { $set: { "userData.events": events } }
    );

    // keep AppSheet in sync
    try {
      const list = Object.keys(events).sort().join(", ");
      const count = Object.keys(events).length;
      await appsheetUpdateRow({
        Email: user.email,
        EventsAttended: list,
        NumEventsAttended: count,
      });
    } catch (e) {
      console.warn("[AppSheet sync] failed:", e?.message || e);
    }

    return res.json({ message: "fixed", userid: user.userid, events });
  } catch (e) {
    console.error("[fix-user-events] error:", e);
    return res.status(500).json({ message: "internal error" });
  }
});

export default router;

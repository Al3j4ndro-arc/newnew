import express from "express";
import bcrypt from "bcrypt";

const router = express.Router();
import { Config, User } from "../db/database.js";
import verifyToken from "./utils/token.js";

const isAdminMiddleware = (req, res, next) => {
    if (req.user.usertype != "admin") {
        res.status(401).json({
            message: "unauthorized",
        });
        return;
    }
    next();
};

router.use(verifyToken);
router.use(isAdminMiddleware);

router.post("/set-event-code", async (req, res) => {
    if (!req.body.eventName || !req.body.eventCode) {
        res.status(400).json({
            message: "missing required fields",
        });
        return;
    }
    let config = await Config.findOne({
        configType: "eventCodes",
    });
    if (!config) {
        const newConfig = new Config({
            configType: "eventCodes",
        });
        newConfig.configData = {};
        newConfig.configData[req.body.eventName] = req.body.eventCode;
        newConfig.markModified("configData");
        newConfig
            .save()
            .then(() => {
                res.status(200).json({
                    message: "event code saved to database",
                });
            })
            .catch((err) => {
                res.status(500).json({
                    message: "error saving event code to database",
                });
            });
    } else {
        config.configData[req.body.eventName] = req.body.eventCode;
        config.markModified("configData");
        config
            .save()
            .then(() => {
                res.status(200).json({
                    message: "event code saved to database",
                });
            })
            .catch((err) => {
                res.status(500).json({
                    message: "error saving event code to database",
                });
            });
    }
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
    Config.findOne({
        configType: "eventCodes",
    })
        .then((config) => {
            if (!config) {
                res.status(200).json({
                    message: "no event codes in database",
                    eventCodes: {},
                });
            } else {
                res.status(200).json({
                    message: "event codes found in database",
                    eventCodes: config.configData,
                });
            }
        })
        .catch((err) => {
            res.status(500).json({
                message: "error finding event codes in database",
            });
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


router.get("/candidate-resume/:email", async (req, res) => {
    User.findOne({ email: req.params.email })
        .then((candidate) => {
            if (!candidate) {
                res.status(500).json({
                    message: "error finding candidate in database",
                });
            } else {
                if (!candidate.userData || !candidate.userData.application || !candidate.userData.application.resume) {
                    res.status(500).json({
                        message: "error finding resume in database",
                    });
                }
                res.header("Content-Type", "application/pdf");
                res.end(candidate.userData.application.resume.split(",")[1], "base64");
            }
        })
});

router.get("/candidate-profile-img/:email", async (req, res) => {
    User.findOne({ email: req.params.email })
        .then((candidate) => {
            if (!candidate) {
                res.status(500).json({
                    message: "error finding candidate in database",
                });
            } else {
                if (!candidate.userData || !candidate.userData.application || !candidate.userData.application.profileImg) {
                    res.status(500).json({
                        message: "error finding profile image in database",
                    });
                }
                let filetype = candidate.userData.application.profileImg.split(";")[0].split("/")[1]
                res.header("Content-Type", `image/${filetype}`);
                return res.end(candidate.userData.application.profileImg.split(",")[1], "base64");
            }
        })
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
                    csv += (events.meettheteam ? "Yes" : "No") + "," + (events.pdpanel ? "Yes" : "No") + "," + (events.deipanel ? "Yes" : "No") + "," + (events.resumereview ? "Yes" : "No") + "," + (events.cheesecakesocial ? "Yes" : "No") + "," + (events.caseworkshop ? "Yes" : "No") + ",";
                    csv += `https://apply.mitconsulting.group/api/admin/candidate-resume/${candidate.email}` + "," + `https://apply.mitconsulting.group/api/admin/candidate-profile-img/${candidate.email}` + ",";
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



export default router;

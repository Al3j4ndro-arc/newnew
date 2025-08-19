import express from "express";

import { User } from "../../db/user.js";
import verifyToken from "../utils/token.js";

const router = express.Router();

const checkAdminOrMember = (req, res, next) => {
    if (
        req.user.usertype == "admin" ||
        req.user.usertype == "member"
    ) {
        next();
    } else {
        res.status(403).json({
            message: "forbidden, if you're a member please login",
        });
    }
};

router.use(verifyToken);
router.use(checkAdminOrMember);

router.get("/all-candidates", async (req, res) => {
    // all candidates with accounts
    User.find({ usertype: "candidate" })
        .then((candidates) => {
            if (!candidates) {
                res.status(500).json({
                    message: "error finding candidates in database",
                });
            } else {
                candidates = candidates.map((candidate) => {
                    return {
                        name:
                            candidate.firstname + " " + candidate.lastname,
                        email: candidate.email,
                    };
                });
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

router.post("/submit-feedback", async (req, res) => {
    if (!req.body.candidate && !req.body.email) {
        res.status(400).json({
            message: "candidate selection required",
        });
        return;
    }

    if (!req.body.event) {
        res.status(400).json({
            message: "event selection required",
        });
        return;
    }

    if (req.body.candidate) {
        User.findOne({ email: req.body.candidate }).then(async (candidate) => {
            if (!candidate) {
                res.status(500).json({
                    message: "error finding candidate in database",
                });
            } else {
                let feedback = {
                    submittedBy:
                        req.user.firstname + " " + req.user.lastname,
                    event: req.body.event,
                    comments: req.body.comments,
                };
                if (req.body.scores.commitment) {
                    feedback.commitment = req.body.scores.commitment
                }
                if (req.body.scores.socialfit) {
                    feedback.socialfit = req.body.scores.socialfit
                }
                if (req.body.scores.challenge) {
                    feedback.challenge = req.body.scores.challenge
                }
                if (req.body.scores.tact) {
                    feedback.tact = req.body.scores.tact
                }
                if (req.body.comment) {
                    feedback.comment = req.body.comment
                }
                if (!candidate.userData) {
                    candidate.userData = {};
                }
                if (!candidate.userData.feedback) {
                    candidate.userData.feedback = [];
                }
                candidate.userData.feedback.push(feedback);
                candidate.markModified("userData");
                candidate
                    .save()
                    .then(() => {
                        res.status(200).json({
                            message: "feedback submitted",
                        });
                    })
                    .catch((err) => {
                        res.status(500).json({
                            message: "error saving feedback to database",
                        });
                    });
            }
        });
    } else if (req.body.email !== "") {
        User.findOne({ email: "test@mit.edu" }).then(async (candidate) => {
            if (!candidate) {
                res.status(500).json({
                    message: "error finding email in database",
                });
            } else {
                let feedback = {
                    submittedBy:
                        req.user.firstname + " " + req.user.lastname,
                    event: req.body.event,
                    comments: req.body.comments,
                    target: req.body.email,
                };
                if (req.body.scores.commitment) {
                    feedback.commitment = req.body.scores.commitment
                }
                if (req.body.scores.socialfit) {
                    feedback.socialfit = req.body.scores.socialfit
                }
                if (req.body.scores.challenge) {
                    feedback.challenge = req.body.scores.challenge
                }
                if (req.body.scores.tact) {
                    feedback.tact = req.body.scores.tact
                }
                if (req.body.comment) {
                    feedback.comment = req.body.comment
                }
                if (!candidate.userData) {
                    candidate.userData = {};
                }
                if (!candidate.userData.feedback) {
                    candidate.userData.feedback = [];
                }
                candidate.userData.feedback.push(feedback);
                candidate.markModified("userData");
                candidate
                    .save()
                    .then(() => {
                        res.status(200).json({
                            message: "feedback submitted",
                        });
                    })
                    .catch((err) => {
                        res.status(500).json({
                            message: "error saving feedback to database",
                        });
                    });
            }
        });

    } else {
        return res.status(400).json({
            message: "candidate selection required",
        });
    }
});

router.post("/update", async (req, res) => {
    const promises = [];
    User.findOne({ email: 'test@mit.edu' }).then(async (candidate) => {
        if (!candidate) {
            res.status(500).json({
                message: "error locating all unassigned feedback",
            });
        } else {
            let all_feedback = candidate.userData.feedback
            for (const feedback of all_feedback) {
                User.findOne({ email: feedback.target }).then(async (pnm) => {
                    if (pnm) {
                        let new_feedback = {
                            submittedBy:
                                feedback.submittedBy,
                            event: feedback.event,
                            comments: feedback.comments,
                        };

                        if (feedback.commitment) {
                            new_feedback.commitment = feedback.commitment
                        }
                        if (feedback.socialfit) {
                            new_feedback.socialfit = feedback.socialfit
                        }
                        if (feedback.challenge) {
                            new_feedback.challenge = feedback.challenge
                        }
                        if (feedback.tact) {
                            new_feedback.tact = feedback.tact
                        }
                        if (feedback.comment) {
                            new_feedback.comment = feedback.comment
                        }
                        if (!pnm.userData) {
                            pnm.userData = {};
                        }
                        if (!pnm.userData.feedback) {
                            pnm.userData.feedback = [];
                        }
                        pnm.userData.feedback.push(new_feedback)
                        pnm.markModified("userData");
                        promises.push(pnm.save())
                    }
                });
            }
            Promise.all(promises).then(() => {
                res.status(200).json({
                    message: "feedbacks updating",
                });
            })
                .catch((err) => {
                    res.status(500).json({
                        message: "error updating feedback to database",
                    });
                });

        }
    })
});

export default router;

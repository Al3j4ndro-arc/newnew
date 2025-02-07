import express from "express";

import { User } from "../../db/user";
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
                console.log("error finding conflicts")
            } else {
                candidates = candidates.map((candidate) => {
                    return {
                        name: candidate.firstname + " " + candidate.lastname,
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
            console.log("error finding conflicts")
        });
});


router.post("/submit-conflict", async (req, res) => {
    if (!req.body.data) {
        res.status(400).json({
            message: "no data",
        });
        return;
    }

    if (req.user) {
        User.findOne({ email: req.user.email }).then(async (member) => {
            if (!member) {
                res.status(500).json({
                    message: "error finding member in database",
                });
            } else {
                const conflicts = [];
                for (const candidate of req.body.data) {
                    if (candidate.conflict) {
                        conflicts.push(candidate.pnm.email)
                    }
                }
                member.conflict = conflicts;
                console.log(member.conflict)
                member.markModified("conflict");
                member
                    .save()
                    .then(() => {
                        res.status(200).json({
                            message: "conflicts updates",
                        });
                    })
                    .catch((err) => {
                        console.log(err)
                        res.status(500).json({
                            message: "error saving conflicts to database",
                        });
                    });
            }
        });

    } else {
        return res.status(400).json({
            message: "user required",
        });
    }
});

export default router;

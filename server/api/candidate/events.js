import express from "express";

import { Config } from "../../db/database.js";
import verifyToken from "../utils/token.js";

const router = express.Router();

router.post("/event-signin", verifyToken, async (req, res) => {
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
        res.status(500).json({
            message: "error finding event codes in database",
        });
        return;
    }
    if (config.configData[req.body.eventName] === req.body.eventCode) {
        if (!req.user.userData) {
            req.user.userData = {};
        }
        if (!req.user.userData.events) {
            req.user.userData.events = {};
        }
        req.user.userData.events[req.body.eventName] = true;
        req.user.markModified("userData");
        req.user
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
        res.status(400).json({
            message: "invalid event code",
        });
    }
});

export default router;

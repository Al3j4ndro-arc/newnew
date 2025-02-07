import express from "express";

import verifyToken from "./utils/token.js";

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
    let userData = {}
    if (req.user.userData.events) {
        userData.events = req.user.userData.events
    }
    if (req.user.userData.application) {
        userData.application = req.user.userData.application
    }
    let data = {
        firstname: req.user.firstname,
        lastname: req.user.lastname,
        email: req.user.email,
        userData: userData,
        usertype: req.user.usertype,
        conflict: req.user.conflict,
    };
    res.status(200).json({
        message: "success",
        data: data,
    });
});

export default router;

import express from "express";
import verifyToken from "../utils/token.js";

const router = express.Router();
router.use(verifyToken);

const hasRequiredFields = (req, res, next) => {
    if (
        !req.body.firstname ||
        !req.body.lastname ||
        !req.body.email ||
        !req.body.classYear ||
        !req.body.resume
    ) {
        res.status(400).json({
            message: "missing required fields",
        });
        return;
    }
    next();
};

router.get("/get-application", async (req, res) => {
    const user = req.user;
    if (user.userData && user.userData.application) {
        res.status(200).json({
            application: user.userData.application,
        });
    } else {
        res.status(200).json({
            application: {},
        });
    }
});

router.post("/submit-application", hasRequiredFields, async (req, res) => {
    const user = req.user;

    if (user.userData && user.userData.application) {
        var application = user.userData.application;
    } else {
        var application = {};
    }

    application.firstname = req.body.firstname;
    application.lastname = req.body.lastname;
    application.email = req.body.email;
    application.classYear = req.body.classYear;
    if (req.body.profileImg) {
        application.profileImg = req.body.profileImg;
    }
    if (req.body.resume) {
        application.resume = req.body.resume;
    }
    application.opt1 = req.body.opt1;
    application.opt2 = req.body.opt2;

    application.submittedAt = Date.now();

    if (!user.userData) {
        user.userData = {};
    }
    user.userData.application = application;
    user.markModified("userData");
    user
        .save()
        .then(() => {
            res.status(200).json({
                message: "application submitted",
            });
        })
        .catch((err) => {
            res.status(500).json({
                message: "error submitting application",
            });
        });
});

export default router;

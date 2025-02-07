import express from "express";
import bcrypt from "bcrypt";
import { v4 } from "uuid";
import jwt from "jsonwebtoken";

import { User } from "../../db/database.js";
import verifyToken from "./token.js";

const router = express.Router();

const uuid = v4;

const hasRequiredSignup = (req) => {
  try {
    const { firstname, lastname, email, password } = req.body;
    if (!lastname || lastname.length < 1) {
      return false;
    }
    if (!firstname || firstname.length < 1) {
      return false;
    }
    if (!email || email.length < 1) {
      return false;
    }
    if (!password || password.length < 1) {
      return false;
    }
  } catch (error) {
    return false;
  }
  return true;
};

router.post("/signup", async (req, res) => {
  if (!hasRequiredSignup(req)) {
    res.status(400).json({
      message: "missing required fields",
    });
    return;
  }

  const { firstname, lastname, email, password, feedback } = req.body;

  let existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    res.status(409).json({
      message: "email already signed up. Please contact emmachen@mit.edu if you think this is a mistake",
    });
    return;
  }

  var salt = await bcrypt.genSalt(10);
  var savedPassword = await bcrypt.hash(password, salt);

  const newUser = new User({
    userid: uuid(),
    firstname: firstname,
    lastname: lastname,
    email: email,
    password: savedPassword,
    usertype: "candidate",
    userData: {
      feedback: [],
      events: {},
      application: {},
    },
    decision: "pending",
    conflict: [],
  });

  newUser
    .save()
    .then((saved) => {
      const token = jwt.sign(
        {
          userid: saved.userid,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRES_IN,
        }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: true,
      });
      res.status(200).json({
        message: "user created",
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "error creating user",
      });
    });
});

router.post("/login", async (req, res) => {
  try {
    if (!req.body.email || !req.body.password) {
      res.status(400).json({
        message: "missing required fields",
      });
      return;
    }
  } catch (error) {
    res.status(400).json({
      message: "missing required fields",
    });
    return;
  }

  const { email, password } = req.body;

  let existingUser = await User.findOne({ email: email });
  if (!existingUser) {
    res.status(400).json({
      message: "invalid credentials",
    });
    return;
  }

  const match = await bcrypt.compare(password, existingUser.password);

  if (!match) {
    res.status(400).json({
      message: "invalid credentials",
    });
    return;
  }

  const token = jwt.sign(
    {
      userid: existingUser.userid,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: false,
    sameSite: true,
  });

  res.status(200).json({
    message: "login successful",
  });
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({
    message: "logout successful",
  });
});

router.post("/refresh-token", verifyToken, (req, res) => {
  const token = jwt.sign(
    {
      userid: req.user.userid,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: false,
    sameSite: true,
  });

  res.status(200).json({
    message: "token refreshed",
  });
});

router.get("/unassigned-feedback", async (req, res) => {
  // all candidates with accounts
  User.findOne({ email: "test@mit.edu" })
    .then((candidate) => {
      if (!candidate) {
        res.status(500).json({
          message: "error finding test candidate",
        });
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

export default router;

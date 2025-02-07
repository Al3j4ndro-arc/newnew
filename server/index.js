import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";

dotenv.config();

const app = express();

// Helmet
app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
    })
);

// Body Parser
app.use(bodyParser.json(
    {
        limit: "5mb",
    }
));

app.use((err, req, res, next) => {
    if (err) {
        return res.status(413).json({
            message: "file too large, please upload a smaller profile picture/resume",
        })
    } else {
        next()
    }
})

// Cookie Parser
app.use(cookieParser());

// API
import api from "./api/api.js";
app.use("/api", api);

const port = process.env.PORT || 5000;

// Serve production build
app.use(express.static(path.join(__dirname, "../client/public/dist/")))

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/public/dist/index.html"));
});

app.listen(port, () =>
    console.log(`Server started on port: 5000`)
);
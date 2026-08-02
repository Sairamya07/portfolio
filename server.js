const express = require("express");
const path = require("path");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "portfolio")));

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Secure API contact route
app.post("/api/contact", async (req, res) => {
    const { visitor_name, visitor_email, subject, message } = req.body;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    console.log("Incoming Contact Form");

    // Server-side validation
    if (!visitor_name || !visitor_name.trim()) {
        return res.status(400).json({ error: "Name field is required." });
    }
    if (!visitor_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(visitor_email.trim())) {
        return res.status(400).json({ error: "A valid email address is required." });
    }
    if (!message || !message.trim()) {
        return res.status(400).json({ error: "Message field is required." });
    }

    const cleanSubject = subject ? subject.trim() : 'New Contact Form Submission';
    const cleanName = visitor_name.trim();
    const cleanEmail = visitor_email.trim();
    const cleanMsg = message.trim();
    const submissionTime = new Date().toLocaleString();

    const fullMessage = `You have received a new contact message from your portfolio.

Visitor Details:
---------------------------------------------
Name: ${cleanName}
Email: ${cleanEmail}
Date & Time: ${submissionTime}
IP Address: ${ipAddress}

Subject: ${cleanSubject}

Message:
---------------------------------------------
${cleanMsg}
`;

    try {
        await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to: process.env.RECEIVER_EMAIL,
            replyTo: cleanEmail,
            subject: `[Contact Form] ${cleanSubject}`,
            text: fullMessage
        });

        console.log("Email Sent Successfully");
        return res.status(200).json({
            message: "Thank you! Your message has been sent successfully."
        });

    } catch (err) {
        console.error("SMTP Error");
        console.error(err);
        return res.status(500).json({
            error: err.message
        });
    }
});

// Fallback to navigate SPA or direct pages to index.html
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "portfolio", "index.html"));
});

// Server Startup wrapping async verification
const startServer = async () => {
    try {
        await transporter.verify();
        console.log("SMTP verified successfully.");
        console.log("SMTP Connected");
    } catch (err) {
        console.error("SMTP Error");
        console.error(err);
    }

    const server = app.listen(PORT, () => {
        console.log("Server Started");
        console.log(`Portfolio Server is running at http://localhost:${PORT}`);
    });

    server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
            console.error(`[Server Error]: Port ${PORT} is already in use. Please check if another process is running.`);
        } else {
            console.error("Express server error:", err);
        }
    });
};

startServer();

const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and body parsers
app.use(cors());
app.use(express.json());

// Serve static portfolio files directly from relative directory
app.use(express.static(path.join(__dirname, 'portfolio')));

// Secure api route for forwarding message context
app.post('/api/contact', async (req, res) => {
    const { visitor_name, visitor_email, subject, message } = req.body;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    console.log(`[Form Submission] Received query. IP: ${ipAddress}`);

    // Server-side input validations
    if (!visitor_name || !visitor_name.trim()) {
        return res.status(400).json({ error: "Name field is required." });
    }
    if (!visitor_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(visitor_email.trim())) {
        return res.status(400).json({ error: "A valid email address is required." });
    }
    if (!message || !message.trim()) {
        return res.status(400).json({ error: "Message field is required." });
    }

    // Nodemailer transporter integration using environment variables
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpSecure = process.env.SMTP_SECURE === 'true';
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    console.log(`[SMTP Config Check]: Host=${smtpHost}, Port=${smtpPort}, Secure=${smtpSecure}, User=${emailUser ? emailUser : 'Not Set'}`);

    // Configuration assertions
    if (!emailUser || emailUser === 'your_email@gmail.com') {
        console.error("[SMTP Error]: EMAIL_USER is not set or contains the default placeholder value.");
        return res.status(500).json({
            error: "EMAIL_USER environment variable is unset or contains default placeholder value."
        });
    }
    if (!emailPass || emailPass === 'your_gmail_app_password') {
        console.error("[SMTP Error]: EMAIL_PASS is not set or contains the default placeholder value.");
        return res.status(500).json({
            error: "EMAIL_PASS environment variable is unset or contains default placeholder value."
        });
    }

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
            user: emailUser,
            pass: emailPass
        }
    });

    // Verify SMTP connection before attempting to send mail
    try {
        console.log("[SMTP Status]: Testing connection to mail server...");
        await transporter.verify();
        console.log("[SMTP Status]: Verification success. Mail server is responsive and credentials accepted.");
    } catch (verifyError) {
        console.error("[SMTP Error]: Connection verification failed: ", verifyError);
        return res.status(500).json({
            error: `Gmail/SMTP Authentication failed. Please ensure setup matches instructions. Details: ${verifyError.message}`
        });
    }

    const cleanSubject = subject ? subject.trim() : 'New Contact Form Submission';
    const cleanName = visitor_name.trim();
    const cleanEmail = visitor_email.trim();
    const cleanMsg = message.trim();
    const submissionTime = new Date().toLocaleString();

    // Setup mail schema
    const mailOptions = {
        from: `"${cleanName}" <${process.env.EMAIL_USER}>`,
        to: process.env.RECEIVER_EMAIL,
        replyTo: cleanEmail,
        subject: `[Contact Form] ${cleanSubject}`,
        text: `You have received a new contact message from your portfolio site.

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
`
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email relay sent successfully. ID: %s", info.messageId);

        return res.status(200).json({
            message: "Thank you! Your message has been sent successfully."
        });
    } catch (err) {
        console.error("Nodemailer service failed: ", err);
        return res.status(500).json({
            error: `Failed to send email. Details: ${err.message}`
        });
    }
});

// Fallback to navigate SPA or direct pages to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'portfolio', 'index.html'));
});

// Start unified server
app.listen(PORT, (err) => {
    if (err) {
        console.error("Start up error occurred on Express listener:", err);
        return;
    }
    console.log(`Portfolio Server is running at http://localhost:${PORT}`);
});

// 2. Verify dotenv loads before any environment variables are accessed.
require('dotenv').config();

const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const cors = require('cors');

// Ensure environment variables have safe string values before calling trim
process.env.SMTP_HOST = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
process.env.SMTP_PORT = (process.env.SMTP_PORT || '587').trim();
process.env.SMTP_SECURE = (process.env.SMTP_SECURE || 'false').trim();
process.env.EMAIL_USER = (process.env.EMAIL_USER || '').trim();
process.env.EMAIL_PASS = (process.env.EMAIL_PASS || '').trim();
process.env.RECEIVER_EMAIL = (process.env.RECEIVER_EMAIL || process.env.EMAIL_USER).trim();

// 3. Log the specified environment variables on server startup (Never log EMAIL_PASS.)
console.log("=== SMTP Server Configuration Startup Diagnostics ===");
console.log(`SMTP_HOST:      "${process.env.SMTP_HOST}"`);
console.log(`SMTP_PORT:      "${process.env.SMTP_PORT}"`);
console.log(`SMTP_SECURE:    "${process.env.SMTP_SECURE}"`);
console.log(`EMAIL_USER:     "${process.env.EMAIL_USER}"`);
console.log(`RECEIVER_EMAIL: "${process.env.RECEIVER_EMAIL}"`);
console.log("=====================================================");

// 5 & 6. Configure Nodemailer with connection settings and timeouts
const transportOptions = {
    host: process.env.SMTP_HOST.trim(),
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.EMAIL_USER.trim(),
        pass: process.env.EMAIL_PASS.trim()
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
};

// Create a single reusable transporter instance
const transporter = nodemailer.createTransport(transportOptions);

// 8. Improve error handling by distinguishing error categories safely without throwing
function classifySmtpError(error, host) {
    const errorInfo = {
        category: "Unknown Error",
        message: "",
        code: "",
        command: "",
        response: "",
        responseCode: ""
    };

    const hostName = host || '';

    // 6. Ensure classifySmtpError() never throws an exception
    try {
        // 7. Add null checks before reading: error.code, error.responseCode, error.message
        const errorCode = (error && error.code) ? String(error.code) : "";
        const errorMessage = (error && error.message) ? String(error.message) : "";
        const errorResponseCode = (error && error.responseCode) ? Number(error.responseCode) : "";
        const errorCommand = (error && error.command) ? String(error.command) : "";
        const errorResponse = (error && error.response) ? String(error.response) : "";

        // Populate errorInfo safely
        errorInfo.code = errorCode;
        errorInfo.message = errorMessage;
        errorInfo.responseCode = errorResponseCode;
        errorInfo.command = errorCommand;
        errorInfo.response = errorResponse;

        // 3. Ensure the function uses the correct parameter consistently.
        // 4. Do not reference undefined variables like errInfo.
        // 5. Replace every undefined reference with the actual function argument (checked variables from error).
        if (
            errorCode === 'EAUTH' ||
            errorResponseCode === 535 ||
            errorMessage.includes('535') ||
            errorMessage.toLowerCase().includes('username and password not accepted') ||
            errorMessage.toLowerCase().includes('authentication')
        ) {
            errorInfo.category = "Authentication failed";
            errorInfo.diagnostic = "SMTP authentication failed. Verify EMAIL_USER and EMAIL_PASS are correct. If using Gmail, you must use a 16-character App Password, and 2-Step Verification must be enabled.";
        } else if (errorCode === 'ENOTFOUND' || errorMessage.includes('getaddrinfo ENOTFOUND')) {
            errorInfo.category = "DNS lookup failed";
            errorInfo.diagnostic = `DNS lookup failed for SMTP host "${hostName}". The server could not resolve the mail server address. Please verify SMTP_HOST.`;
        } else if (
            errorCode === 'ETIMEDOUT' ||
            errorMessage.toLowerCase().includes('timeout') ||
            errorMessage.toLowerCase().includes('timed out')
        ) {
            errorInfo.category = "Connection timeout";
            errorInfo.diagnostic = `Connection to "${hostName}" timed out. This often occurs when outbound SMTP traffic on ports like 25, 465, or 587 is blocked by your hosting environment's firewall (e.g. Render blocks port 25).`;
        } else if (
            errorCode === 'ECONNREFUSED' ||
            errorMessage.toLowerCase().includes('connection refused')
        ) {
            errorInfo.category = "Gmail / Provider rejected connection";
            errorInfo.diagnostic = `The connection to "${hostName}" was refused or rejected by the target server. This might occur if Gmail or your provider is blocking requests from this IP pool due to rate-limiting/spam protection.`;
        } else if (
            errorCode === 'ERR_SSL_WRONG_VERSION_NUMBER' ||
            errorMessage.toLowerCase().includes('ssl') ||
            errorMessage.toLowerCase().includes('tls') ||
            errorMessage.toLowerCase().includes('starttls') ||
            errorMessage.toLowerCase().includes('secure')
        ) {
            errorInfo.category = "TLS errors";
            errorInfo.diagnostic = `TLS/SSL handshake or protocol negotiation failed. Make sure SMTP_SECURE matches the chosen port (typically, set SMTP_SECURE=true for port 465 (SSL/TLS) and SMTP_SECURE=false for port 587 (STARTTLS)).`;
        } else if (hostName.includes('gmail.com') && (errorMessage.toLowerCase().includes('gmail') || errorMessage.toLowerCase().includes('smtp.gmail.com'))) {
            errorInfo.category = "Gmail rejected connection";
            errorInfo.diagnostic = "Gmail SMTP rejected the connection. If this persists, please switch to a reliable transactional provider like Brevo or Resend.";
        }
    } catch (e) {
        console.error("Error during SMTP error classification:", e);
    }

    return errorInfo;
}


// 7. Add transporter.verify() during server startup and print detailed diagnostics
// 9. If SMTP connection fails, print the complete stack trace to the console
console.log("[SMTP Status]: Verifying connection to mail server at startup...");
transporter.verify()
    .then(() => {
        console.log("[SMTP Status]: Verification success. Mail server is responsive and credentials accepted.");
    })
    .catch((err) => {
        const classified = classifySmtpError(err, process.env.SMTP_HOST);
        console.error("=================== SMTP STARTUP ERROR ===================");
        console.error(`Category: ${classified.category}`);
        console.error(`Diagnostic: ${classified.diagnostic}`);
        console.error(`Original Error Code: ${classified.code}`);
        console.error("Complete stack trace:");
        console.error(err.stack || err);
        console.error("==========================================================");

        console.log("\n[SMTP Recommendation]: If Gmail SMTP continues to fail, you can configure a transactional");
        console.log("email provider (such as Brevo or Resend) using environment variables:");
        console.log("Example for Brevo:");
        console.log("  SMTP_HOST=smtp-relay.brevo.com");
        console.log("  SMTP_PORT=587");
        console.log("  SMTP_SECURE=false");
        console.log("  EMAIL_USER=<brevo_email>");
        console.log("  EMAIL_PASS=<brevo_smtp_key>");
        console.log("Example for Resend:");
        console.log("  SMTP_HOST=smtp.resend.com");
        console.log("  SMTP_PORT=465");
        console.log("  SMTP_SECURE=true");
        console.log("  EMAIL_USER=resend");
        console.log("  EMAIL_PASS=<resend_api_key>\n");
    });

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

    const cleanSubject = subject ? subject.trim() : 'New Contact Form Submission';
    const cleanName = visitor_name.trim();
    const cleanEmail = visitor_email.trim();
    const cleanMsg = message.trim();
    const submissionTime = new Date().toLocaleString();

    // Setup mail schema
    const mailOptions = {
        from: `"${cleanName}" <${process.env.EMAIL_USER.trim()}>`,
        to: process.env.RECEIVER_EMAIL.trim(),
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
        const classified = classifySmtpError(err, process.env.SMTP_HOST);

        console.error("=================== SMTP SEND ERROR ===================");
        console.error(`Category: ${classified.category}`);
        console.error(`Diagnostic: ${classified.diagnostic}`);
        console.error(`Original Error Code: ${classified.code}`);
        console.error("Complete stack trace:");
        console.error(err.stack || err);
        console.error("=======================================================");

        // Return a precise user facing error message keeping Contact Me API format
        let customMessage = `Failed to send message. ${classified.category}. ${classified.diagnostic}`;
        if (classified.category === "Unknown Error") {
            // Match the user's reported error message format exactly as fallback
            customMessage = `Failed to send message. SMTP connection timed out or host not found. Please review your SMTP_HOST (${process.env.SMTP_HOST.trim()}) and SMTP_PORT (${process.env.SMTP_PORT}) settings.`;
        }

        return res.status(500).json({
            error: customMessage
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
        console.log(`Port is: ${PORT}`);
        console.error("Start up error occurred on Express listener:", err);
        return;
    }
    console.log(`Portfolio Server is running at http://localhost:${PORT}`);
});

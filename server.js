// 2. Verify dotenv loads before any environment variables are accessed.
require('dotenv').config();

const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const cors = require('cors');
const https = require('https');

// Ensure environment variables have safe string values before calling trim
process.env.EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || 'smtp').trim().toLowerCase();

process.env.SMTP_HOST = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
process.env.SMTP_PORT = (process.env.SMTP_PORT || '587').trim();
process.env.SMTP_SECURE = (process.env.SMTP_SECURE || 'false').trim();
process.env.EMAIL_USER = (process.env.EMAIL_USER || '').trim();
process.env.EMAIL_PASS = (process.env.EMAIL_PASS || '').trim();

process.env.RESEND_API_KEY = (process.env.RESEND_API_KEY || '').trim();
process.env.BREVO_API_KEY = (process.env.BREVO_API_KEY || '').trim();
process.env.SENDER_EMAIL = (process.env.SENDER_EMAIL || process.env.EMAIL_USER).trim();
process.env.RECEIVER_EMAIL = (process.env.RECEIVER_EMAIL || process.env.EMAIL_USER).trim();

const emailProvider = process.env.EMAIL_PROVIDER;

// 3. Log the specified environment variables on server startup (Never log EMAIL_PASS or API Keys values.)
console.log("=== SMTP / API Email Server Configuration Startup Diagnostics ===");
console.log(`EMAIL_PROVIDER: "${emailProvider}"`);
console.log(`SMTP_HOST:      "${process.env.SMTP_HOST}"`);
console.log(`SMTP_PORT:      "${process.env.SMTP_PORT}"`);
console.log(`SMTP_SECURE:    "${process.env.SMTP_SECURE}"`);
console.log(`EMAIL_USER:     "${process.env.EMAIL_USER}"`);
console.log(`RECEIVER_EMAIL: "${process.env.RECEIVER_EMAIL}"`);
console.log(`SENDER_EMAIL:   "${process.env.SENDER_EMAIL}"`);
console.log(`RESEND_API_KEY: "${process.env.RESEND_API_KEY ? '[SET (Masked)]' : '[NOT SET]'}"`);
console.log(`BREVO_API_KEY:  "${process.env.BREVO_API_KEY ? '[SET (Masked)]' : '[NOT SET]'}"`);
console.log("=================================================================");

// HTTPS helper function for API providers (Zero-dependency)
function makeHttpsRequest(url, headers, bodyData, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            timeout: timeoutMs
        };

        console.log(`[HTTPS Debug]: Connecting to ${parsedUrl.hostname}...`);

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });

        req.on('error', (err) => {
            console.error(`[HTTPS Debug]: Socket/DNS Connection error to ${parsedUrl.hostname}:`, err.message);
            reject(err);
        });

        req.on('timeout', () => {
            console.error(`[HTTPS Debug]: Connection timeout after ${timeoutMs}ms to ${parsedUrl.hostname}`);
            req.destroy();
            const timeoutErr = new Error(`Request to ${url} timed out after ${timeoutMs}ms.`);
            timeoutErr.code = 'ETIMEDOUT';
            reject(timeoutErr);
        });

        req.write(JSON.stringify(bodyData));
        req.end();
    });
}

// 8. Improve error handling by distinguishing SMTP error categories
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

// Nodemailer SMTP Transporter Initialization (if provider is SMTP)
let transporter = null;
if (emailProvider === 'smtp') {
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
        socketTimeout: 10000,
        logger: true, // Enables Nodemailer debug logs to console
        debug: true   // Enables raw SMTP traffic logs to console
    };

    transporter = nodemailer.createTransport(transportOptions);

    // 7. Add transporter.verify() during server startup and print detailed diagnostics
    // 9. If SMTP connection fails, print the complete stack trace to the console
    console.log("[SMTP Status]: Testing connection to mail server at startup...");
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

            console.log("\n[SMTP Recommendation]: Gmail SMTP connection timed out or port 587 is blocked.");
            console.log("Since you are hosted on Render, you should migrate to Resend or Brevo HTTP API.");
            console.log("Configure the following in your environment settings/Render dashboard:");
            console.log("  EMAIL_PROVIDER=resend");
            console.log("  RESEND_API_KEY=re_YOUR_API_KEY");
            console.log("  SENDER_EMAIL=onboarding@resend.dev (or your verified domain sender)");
            console.log("  RECEIVER_EMAIL=your_email@gmail.com");
        });
} else if (emailProvider === 'resend') {
    console.log("[API Status]: Configured for Resend API mode. Verification will occur on message send.");
} else if (emailProvider === 'brevo') {
    console.log("[API Status]: Configured for Brevo API mode. Verification will occur on message send.");
} else {
    console.warn(`[Config Warning]: Unknown EMAIL_PROVIDER: "${emailProvider}". Falling back to SMTP.`);
}

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

    const textBody = `You have received a new contact message from your portfolio site.

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

    // 1. SMTP Delivery Method
    if (emailProvider === 'smtp') {
        const mailOptions = {
            from: `"${cleanName}" <${process.env.EMAIL_USER.trim()}>`,
            to: process.env.RECEIVER_EMAIL.trim(),
            replyTo: cleanEmail,
            subject: `[Contact Form] ${cleanSubject}`,
            text: textBody
        };

        try {
            console.log("[SMTP Send]: Dispatching email relay request via Nodemailer...");
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

            let customMessage = `Failed to send message. ${classified.category}. ${classified.diagnostic}`;
            if (classified.category === "Unknown Error") {
                customMessage = `Failed to send message. SMTP connection timed out or host not found. Please review your SMTP_HOST (${process.env.SMTP_HOST.trim()}) and SMTP_PORT (${process.env.SMTP_PORT}) settings.`;
            }

            return res.status(500).json({
                error: customMessage
            });
        }
    }
    // 2. Resend API Delivery Method
    else if (emailProvider === 'resend') {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            console.error("[API Error]: RESEND_API_KEY environment variable is unset.");
            return res.status(500).json({
                error: "Failed to send message. Resend API Key is missing. Check backend settings."
            });
        }

        const senderEmailAddr = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
        const receiverEmailAddr = process.env.RECEIVER_EMAIL || process.env.EMAIL_USER;

        const sendBody = {
            from: senderEmailAddr,
            to: [receiverEmailAddr],
            subject: `[Contact Form] ${cleanSubject}`,
            text: textBody,
            reply_to: cleanEmail
        };

        try {
            console.log("[Resend API Send]: Dispatching request to Resend API endpoint...");
            console.log(`From: ${senderEmailAddr} | To: ${receiverEmailAddr}`);

            const response = await makeHttpsRequest(
                'https://api.resend.com/emails',
                { 'Authorization': `Bearer ${resendApiKey}` },
                sendBody
            );

            console.log(`[Resend Response]: Code: ${response.statusCode} | Data: ${response.body}`);

            if (response.statusCode >= 200 && response.statusCode < 300) {
                return res.status(200).json({
                    message: "Thank you! Your message has been sent successfully."
                });
            } else {
                let errorMsg = response.body || "No details provided.";
                try {
                    const parsed = JSON.parse(response.body);
                    if (parsed.message) errorMsg = parsed.message;
                } catch (_) { }

                return res.status(500).json({
                    error: `Failed to send message via Resend API [Status ${response.statusCode}]: ${errorMsg}`
                });
            }
        } catch (err) {
            console.error("=================== RESEND API ERROR ===================");
            console.error(err.stack || err);
            console.error("=======================================================");

            let cat = "API request failed";
            let diag = err.message || "Unknown networking issue.";
            if (err.code === 'ETIMEDOUT') {
                cat = "Connection timeout";
                diag = "Resend API connection timed out. Check network firewall limits.";
            } else if (err.code === 'ENOTFOUND') {
                cat = "DNS lookup failed";
                diag = "Could not resolve hostname api.resend.com.";
            }

            return res.status(500).json({
                error: `Failed to send message. ${cat}. ${diag}`
            });
        }
    }
    // 3. Brevo API Delivery Method
    else if (emailProvider === 'brevo') {
        const brevoApiKey = process.env.BREVO_API_KEY;
        if (!brevoApiKey) {
            console.error("[API Error]: BREVO_API_KEY environment variable is unset.");
            return res.status(500).json({
                error: "Failed to send message. Brevo API Key is missing. Check backend settings."
            });
        }

        const senderEmailAddr = process.env.SENDER_EMAIL || process.env.EMAIL_USER;
        const receiverEmailAddr = process.env.RECEIVER_EMAIL || process.env.EMAIL_USER;

        const sendBody = {
            sender: {
                name: cleanName || "Portfolio Visitor",
                email: senderEmailAddr
            },
            to: [{ email: receiverEmailAddr }],
            replyTo: { email: cleanEmail },
            subject: `[Contact Form] ${cleanSubject}`,
            textContent: textBody
        };

        try {
            console.log("[Brevo API Send]: Dispatching request to Brevo API endpoint...");
            console.log(`From: ${senderEmailAddr} | To: ${receiverEmailAddr}`);

            const response = await makeHttpsRequest(
                'https://api.brevo.com/v3/smtp/email',
                { 'api-key': brevoApiKey },
                sendBody
            );

            console.log(`[Brevo Response]: Code: ${response.statusCode} | Data: ${response.body}`);

            if (response.statusCode >= 200 && response.statusCode < 300) {
                return res.status(200).json({
                    message: "Thank you! Your message has been sent successfully."
                });
            } else {
                let errorMsg = response.body || "No details provided.";
                try {
                    const parsed = JSON.parse(response.body);
                    if (parsed.message) errorMsg = parsed.message;
                } catch (_) { }

                return res.status(500).json({
                    error: `Failed to send message via Brevo API [Status ${response.statusCode}]: ${errorMsg}`
                });
            }
        } catch (err) {
            console.error("=================== BREVO API ERROR ===================");
            console.error(err.stack || err);
            console.error("=======================================================");

            let cat = "API request failed";
            let diag = err.message || "Unknown networking issue.";
            if (err.code === 'ETIMEDOUT') {
                cat = "Connection timeout";
                diag = "Brevo API connection timed out. Check network firewall limits.";
            } else if (err.code === 'ENOTFOUND') {
                cat = "DNS lookup failed";
                diag = "Could not resolve hostname api.brevo.com.";
            }

            return res.status(500).json({
                error: `Failed to send message. ${cat}. ${diag}`
            });
        }
    }
});

// Fallback to navigate SPA or direct pages to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'portfolio', 'index.html'));
});

// Start unified server
const server = app.listen(PORT, () => {
    console.log(`Portfolio Server is running at http://localhost:${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`[Server Error]: Port ${PORT} is already in use. Please check if another process is running.`);
    } else {
        console.error("Express server error:", err);
    }
});

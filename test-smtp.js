// Test script to verify SMTP transport configuration
const nodemailer = require('nodemailer');
require('dotenv').config();

console.log("=== Node.js SMTP Test Runner ===");
const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
const port = Number(process.env.SMTP_PORT || '587');
const secure = (process.env.SMTP_SECURE || 'false').trim() === 'true';
const user = (process.env.EMAIL_USER || '').trim();
const pass = (process.env.EMAIL_PASS || '').trim();

console.log(`Testing connection parameters:`);
console.log(`Host:    ${host}`);
console.log(`Port:    ${port}`);
console.log(`Secure:  ${secure}`);
console.log(`User:    ${user}`);
console.log("=================================");

if (!user || !pass) {
    console.error("Error: EMAIL_USER and EMAIL_PASS must be set in your .env file.");
    process.exit(1);
}

const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
});

console.log("Verifying SMTP connection...");
transporter.verify((err, success) => {
    if (err) {
        console.error("Verification failed!");
        console.error(err.stack || err);
        process.exit(1);
    } else {
        console.log("SMTP connection verified successfully!");
        process.exit(0);
    }
});

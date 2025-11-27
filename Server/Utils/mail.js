// utils/mail.js
const nodemailer = require('nodemailer');

let transporter;

try {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT || 465),
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
} catch (err) {
  console.warn("Mail transport init failed:", err);
}

async function sendMail({ to, subject, text, html }) {
  if (!transporter) {
    console.warn("sendMail called but transporter not available");
    return { error: "no transporter" };
  }

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    text,
    html
  });
}

module.exports = {
  sendMail
};

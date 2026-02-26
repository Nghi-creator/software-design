import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

export async function sendMail({ to, subject, html }) {
  console.log("➡️ Sending mail to:", to);
  return transporter.sendMail({
    from: `"Online Auction" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,
  });
}

export { transporter };

// backend/src/api/email.js
import nodemailer from "nodemailer";
import "dotenv/config";

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL;
const SUPPORT_EMAIL_PASSWORD = process.env.SUPPORT_EMAIL_PASSWORD;
const SUPPORT_INBOX = process.env.YUMNOM_SUPPORT_INBOX || SUPPORT_EMAIL;

if (!SUPPORT_EMAIL || !SUPPORT_EMAIL_PASSWORD) {
  console.warn(
    "[email] SUPPORT_EMAIL / SUPPORT_EMAIL_PASSWORD not set – email sending will fail."
  );
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: SUPPORT_EMAIL,
    pass: SUPPORT_EMAIL_PASSWORD, // ideally a Gmail App Password
  },
});

export async function sendAiFeedbackEmail({ userEmail, sendCopyToUser, feedback }) {
  const {
    dishName,
    rating,
    tags,
    comment,
    prompt,
    likes,
    restrictions,
    reason,
  } = feedback;

  const subject = `AI Dish Feedback – ${dishName || "Unknown Dish"} (${rating} / 5)`;

  const bodyLines = [
    `Dish: ${dishName || "(none)"}`,
    `Rating: ${rating} / 5`,
    `Tags: ${tags && tags.length ? tags.join(", ") : "(none)"}`,
    "",
    "User comment:",
    comment || "(no comment entered)",
    "",
    "---- AI Context ----",
    `Prompt: ${prompt || "(none)"}`,
    `Likes: ${Array.isArray(likes) ? likes.join(", ") : ""}`,
    `Restrictions: ${Array.isArray(restrictions) ? restrictions.join(", ") : ""}`,
    "",
    "Model explanation:",
    reason || "(none)",
  ];

  const text = bodyLines.join("\n");

  // 1) Send to your support inbox
  await transporter.sendMail({
    from: SUPPORT_EMAIL,
    to: SUPPORT_INBOX,
    subject,
    text,
  });

  // 2) Optional copy to user
  if (sendCopyToUser && userEmail) {
    await transporter.sendMail({
      from: SUPPORT_EMAIL,
      to: userEmail,
      subject: `Copy of your AI Dish feedback – ${dishName || "dish"}`,
      text,
    });
  }
}

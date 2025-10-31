// export default router;
// backend/src/api/reportIssue.js
import express from "express";
import nodemailer from "nodemailer";
import multer from "multer";

const router = express.Router();

/* ---------- ENV ---------- */
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL;                 // e.g. yumnomai.helpdesk@gmail.com
const SUPPORT_EMAIL_PASSWORD = process.env.SUPPORT_EMAIL_PASSWORD; // Gmail App Password
const YUMNOM_SUPPORT_INBOX = process.env.YUMNOM_SUPPORT_INBOX;   // destination inbox

/* ---------- TRANSPORT ---------- */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: SUPPORT_EMAIL, pass: SUPPORT_EMAIL_PASSWORD },
});

/* ---------- MULTER (memory) ---------- */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
});

// accept common field names so the frontend doesn't have to change right now
const acceptFiles = upload.fields([
  { name: "image", maxCount: 5 },
  { name: "file",  maxCount: 5 },
  { name: "files", maxCount: 5 },
]);

/* ---------- EMAIL BODY ---------- */
function buildEmailText(d) {
  return [
    "New issue report submitted",
    "",
    `Reporter: ${d.name || "N/A"} <${d.email || "N/A"}>`,
    `Experience rating: ${d.rating ?? "N/A"} (1–5)`,
    `Frequency: ${d.frequency || "N/A"}`,
    "",
    "Issue:",
    d.issue || "N/A",
    "",
    "Expected Outcome:",
    d.expected || "N/A",
    "",
    "Actual Outcome:",
    d.actual || "N/A",
    "",
    (d.photoNote ? "Note about attached image:\n" + d.photoNote + "\n" : "").trim(),
  ].join("\n");
}

/* ---------- ROUTE ---------- */
router.post("/report-issue", acceptFiles, async (req, res) => {
  try {
    const {
      email,
      name,
      issue,
      expected,
      actual,
      frequency,      // "Never" | "Sometimes" | "Often" | "Always" | "N/A"
      rating,         // "1".."5"
      consent,        // "on" | "true" | boolean
      photoNote,      // optional description for attached images
    } = req.body || {};

    // basic validation
    if (!email || !name || !issue) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields (email, name, issue)." });
    }
    if (!SUPPORT_EMAIL || !SUPPORT_EMAIL_PASSWORD) {
      return res.status(500).json({ success: false, message: "Email service not configured." });
    }
    if (!YUMNOM_SUPPORT_INBOX) {
      return res.status(500).json({ success: false, message: "Support inbox not configured." });
    }

    // normalize
    const normalized = {
      email: String(email).trim(),
      name: String(name).trim(),
      issue: String(issue).trim(),
      expected: expected ? String(expected).trim() : "",
      actual: actual ? String(actual).trim() : "",
      frequency: frequency || "N/A",
      rating: rating ? Number(rating) : undefined,
      consent: consent === "on" || consent === "true" || consent === true,
      photoNote: photoNote ? String(photoNote).trim() : "",
    };

    // collect attachments from any supported field name
    const attachments = [];
    const bucket = req.files || {};
    const candidates = [
      ...(bucket.image || []),
      ...(bucket.file || []),
      ...(bucket.files || []),
    ];
    for (const f of candidates) {
      attachments.push({
        filename: f.originalname || "attachment",
        content: f.buffer,
        contentType: f.mimetype || "application/octet-stream",
      });
    }

    // send email
    await transporter.sendMail({
      from: SUPPORT_EMAIL,
      to: YUMNOM_SUPPORT_INBOX,
      subject: `[Issue Report]`,
      text: buildEmailText(normalized),
      attachments, // empty array if none
      replyTo: normalized.email,
    });

    return res.status(200).json({ success: true }); // YIPPEE
  } catch (err) {
    console.error("report-issue error:", err);
    const isSize = err?.code === "LIMIT_FILE_SIZE";
    return res
      .status(isSize ? 413 : 500)
      .json({ success: false, message: isSize ? "Image too large." : "Failed to submit report." });
  }
});

export default router;

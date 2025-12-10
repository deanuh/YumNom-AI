import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();
// already defined in the .env
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL;
const SUPPORT_EMAIL_PASSWORD = process.env.SUPPORT_EMAIL_PASSWORD;
const YUMNOM_SUPPORT_INBOX = process.env.YUMNOM_SUPPORT_INBOX;

let transporter;
if (SUPPORT_EMAIL && SUPPORT_EMAIL_PASSWORD) {  // access to the YumNom gmail
  transporter = nodemailer.createTransport({  // creating the bridge to transport the "issue" email to YumNom
    service: "gmail",
    auth: { user: SUPPORT_EMAIL, pass: SUPPORT_EMAIL_PASSWORD },
  });
}

function buildEmailText(d) {  // how the email will look to US
  return [
    "Contact form submitted",
    "",
    `Name: ${d.name || "N/A"}`,
		`Email: ${d.email || "N/A"}`,
		"",
    "Message:",
    d.message || "N/A",
    "",
  ].join("\n");
}

router.post("/contact", async (req, res) => {  // send message back to the frontend to see if it went through or not
  try {
    const { email, name, subject, message } = req.body || {};

    if ( !email || !name || !subject || !message ) {
      return res.status(400).json({ success: false, message: "Missing required fields (email, name, issue)." });
    }

    if (!transporter) {
      console.error("Nodemailer not initialized. Check SUPPORT_EMAIL and SUPPORT_EMAIL_PASSWORD env vars.");
      return res.status(500).json({ success: false, message: "Email service not configured." });
    }

    if (!YUMNOM_SUPPORT_INBOX) {
      console.error("YUMNOM_SUPPORT_INBOX env var is missing.");
      return res.status(500).json({ success: false, message: "Support inbox not configured." });
    }

    await transporter.sendMail({  // make sure it went thru
      from: SUPPORT_EMAIL,
      to: YUMNOM_SUPPORT_INBOX,
      subject: `[Contact Us Form] ${String(subject).slice(0, 60) || "No subject"}`,
      text: buildEmailText({ email, name, subject, message }),
    });

    res.status(200).json({ success: true });  //YIPPEE
  } catch (err) {
    console.error("contact error:", err);
    res.status(500).json({ success: false, message: "Failed to submit form." });
  }
});

export default router;

// // backend/api/reportIssue.js
// import express from "express";
// import nodemailer from "nodemailer";
// import admin from "firebase-admin";
// import dbModule from "../firebase/db.cjs"; // same module used elsewhere
// const { db } = dbModule;

// const router = express.Router();

// // Nodemailer (use App Password for Gmail)
// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true,
//   auth: {
//     user: process.env.SUPPORT_EMAIL,
//     pass: process.env.SUPPORT_EMAIL_PASSWORD,
//   },
// });


// function buildEmailText(d, firestoreId) {  // this is to set up the email being sent to YumNom
//   return [
//     "New issue report submitted",
//     "",
//     `Reporter: ${d.name || "N/A"} <${d.email || "N/A"}>`,
//     `Experience rating: ${d.rating ?? "N/A"} (1–5)`,
//     `Frequency: ${d.frequency ?? "N/A"}`,
//     "",
//     "Issue:",
//     d.issue || "N/A",
//     "",
//     "Expected Outcome:",
//     d.expected || "N/A",
//     "",
//     "Actual Outcome:",
//     d.actual || "N/A",
//     "",
//   ].join("\n");
// }

// router.post("/report-issue", async (req, res) => {
//   try {
//     const {
//       email,
//       name,
//       issue,
//       expected,
//       actual,
//       frequency, // never, sometimes, often, always options
//       rating,    // 1..5  (optional)
//       consent,   // boolean
//     } = req.body || {};

//     //  validation for the entry fields (users need to fill this in)
//     if (!email || !name || !issue) {
//       return res.status(400).json({ success: false, message: "Missing required fields (email, name, issue)." });
//     }

//     // **** Save to Firestore (this is optional, but most likely will have in order to keep track later on)
//     let firestoreId = null;
//     if (String(process.env.SAVE_ISSUES_TO_FIRESTORE || "true").toLowerCase() === "true") {
//       const { FieldValue } = admin.firestore;
//       const ref = await db.collection("issueReports").add({
//         email,
//         name,
//         issue,
//         expected: expected ?? "",
//         actual: actual ?? "",
//         frequency: Number.isFinite(Number(frequency)) ? Number(frequency) : null,
//         rating: Number.isFinite(Number(rating)) ? Number(rating) : null,
//         consent: !!consent,
//         createdAt: FieldValue.serverTimestamp(),
//       });
//       firestoreId = ref.id;
//     }

//     // Email being sent out
//     await transporter.sendMail({
//       from: process.env.SUPPORT_EMAIL,
//       to: process.env.YUMNOM_SUPPORT_INBOX,
//       subject: `[Issue Report] ${String(issue).slice(0, 60) || "No subject"}`,
//       text: buildEmailText(
//         {
//           email,
//           name,
//           issue,
//           expected,
//           actual,
//           frequency,
//           rating,
//         },
//         firestoreId
//       ),
//     });

//     res.status(200).json({ success: true, id: firestoreId || undefined });
//   } catch (err) {
//     console.error("report-issue error:", err);
//     res.status(500).json({ success: false, message: "Failed to submit report." });
//   }
// });
// // router.post("/report-issue", (req, res) => {
// //   res.json({ success: true, got: req.body || null });
// // });


// export default router;
// backend/src/api/reportIssue.js

// this new code has it set up so that the emails/issues are not stored in the firebase
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
    "New issue report submitted",
    "",
    `Reporter: ${d.name || "N/A"} <${d.email || "N/A"}>`,
    `Experience rating: ${d.rating ?? "N/A"} (1–5)`,
    `Frequency: ${d.frequency ?? "N/A"}`,
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
  ].join("\n");
}

router.post("/report-issue", async (req, res) => {  // send message back to the frontend to see if it went through or not
  try {
    const { email, name, issue, expected, actual, frequency, rating, consent } = req.body || {};

    if (!email || !name || !issue) {
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
      subject: `[Issue Report] ${String(issue).slice(0, 60) || "No subject"}`,
      text: buildEmailText({ email, name, issue, expected, actual, frequency, rating, consent }),
    });

    res.status(200).json({ success: true });  //YIPPEE
  } catch (err) {
    console.error("report-issue error:", err);
    res.status(500).json({ success: false, message: "Failed to submit report." });
  }
});

export default router;

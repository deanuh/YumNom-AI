// backend/src/api/invites.js  (ESM)
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import transporter from '../email/transporter.js';

const router = Router();

/**
 * POST /api/invites/send
 * Body: {
 *   toEmail: string,         // required
 *   toName?: string,
 *   inviterId: string,       // required
 *   inviterName: string,     // required
 *   inviterEmail: string     // required (stored in token/context; not used for reply)
 * }
 */
router.post('/send', async (req, res) => {
  try {
    const { toEmail, toName, inviterId, inviterName, inviterEmail } = req.body || {};
    if (!toEmail || !inviterId || !inviterName || !inviterEmail) {
      return res.status(400).json({
        error: 'Missing required fields: toEmail, inviterId, inviterName, inviterEmail',
      });
    }

    // Signed token (safe to put in URL, expires in 48h)
    const token = jwt.sign(
      { toEmail, toName: toName || null, inviterId, inviterName, inviterEmail },
      process.env.JWT_SECRET,
      { expiresIn: '48h' }
    );

    const joinUrl = `${process.env.APP_BASE_URL}/party/invite?token=${encodeURIComponent(token)}`;

    const subject = `${inviterName} invited you to a YumNom group meal`;
    const text = `${inviterName} invited you to join a YumNom group meal on YumNom.\nJoin: ${joinUrl}`;
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.5">
        <h2>You're invited to a YumNom group meal!</h2>
        <p>Hi ${toName || 'there'},</p>
        <p><strong>${inviterName}</strong> invited you to join a group meal on YumNom.</p>
        <p>
          <a href="${joinUrl}" style="display:inline-block;padding:10px 14px;border:1px solid #222;border-radius:8px;text-decoration:none;">
            Join the Party
          </a>
        </p>
        <p>If the button doesn’t work, paste this link:<br>${joinUrl}</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM, // "YumNom AI <YumNomAI@gmail.com>"
      to: toEmail,
      subject,
      text,
      html,
      // No replies
      headers: {
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'All',
        'Precedence': 'bulk',
      },
      envelope: {
        from: process.env.SMTP_USER, // bounce address
        to: toEmail,
      },
    });

    return res.json({ ok: true, toEmail, previewJoinUrl: joinUrl });
  } catch (err) {
    console.error('Invite send error:', err);
    return res.status(500).json({ error: 'Failed to send invite' });
  }
});

/**
 * POST /api/invites/verify
 * Body: { token: string }
 */
router.post('/verify', (req, res) => {
  const { token } = req.body || {};
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return res.json({
      ok: true,
      payload,
      redirect: process.env.JOIN_REDIRECT_URL,
    });
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid or expired token' });
  }
});

export default router;

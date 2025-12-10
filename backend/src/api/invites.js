import { Router } from 'express';
import jwt from 'jsonwebtoken';
import transporter from '../email/transporter.js';
import { getGroupFromUserId, addUserToGroup } from '../firebase/dbFunctions.js'; 
import { authMiddleware } from '../auth/auth.js'; 

const router = Router();

/**
 * POST /api/invites/send
 * Use this to send the email invite.
 */
router.post('/send', async (req, res) => {
  try {
    const { toEmail, toName, inviterId, inviterName, inviterEmail } = req.body || {};
    
    if (!toEmail || !inviterId || !inviterName || !inviterEmail) {
      return res.status(400).json({
        error: 'Missing required fields: toEmail, inviterId, inviterName, inviterEmail',
      });
    }

    // Create the token
    const token = jwt.sign(
      { toEmail, toName: toName || null, inviterId, inviterName, inviterEmail },
      process.env.JWT_SECRET,
      { expiresIn: '48h' }
    );

    // Build the link
    const joinUrl = `${process.env.APP_BASE_URL}/party/invite?token=${encodeURIComponent(token)}`;

    // Email content
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

    // Send the email
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: toEmail,
      subject,
      text,
      html,
      headers: {
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'All',
        'Precedence': 'bulk',
      },
      envelope: {
        from: process.env.SMTP_USER,
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
 * This is called when the user clicks the link.
 * * CRITICAL: It uses authMiddleware so we know who the Guest is (req.uid).
 */
router.post('/verify', authMiddleware, async (req, res) => {
  const inviteeUserId = req.uid; // The guest's user ID
  const { token } = req.body || {};

  try {
    // Verify the token
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { inviterId } = payload;

    // Find the HOST'S group
    const groupData = await getGroupFromUserId(inviterId);
    if (!groupData) {
      throw new Error("The host's party could not be found or has ended.");
    }

    // Add the GUEST to that group
    // This connects the two users in the same lobby
    await addUserToGroup(inviteeUserId, groupData.id);
    
    // Return success and the redirect URL (to the Lobby)
    return res.json({ 
      ok: true, 
      redirect: process.env.JOIN_REDIRECT_URL // Should be http://localhost:3000/group-meal
    });

  } catch (err) {
    console.error("Verification failed:", err);
    return res.status(400).json({ ok: false, error: err.message || 'Invalid or expired token' });
  }
});

export default router;
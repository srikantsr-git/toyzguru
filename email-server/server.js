/**
 * ToyzGuru Email Proxy Server
 * Sends transactional emails via Zoho SMTP using Nodemailer.
 * Runs on port 3001 alongside the static frontend on port 3000.
 */

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'https://toyzguru.in',
    'https://www.toyzguru.in',
  ],
  methods: ['POST', 'GET'],
}));
app.use(express.json());

// ─── Zoho SMTP Transporter ───────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.in',
  port: 465,
  secure: true,   // SSL
  auth: {
    user: 'support@toyzguru.in',
    pass: 'Akash@007',
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// ─── Verify SMTP connection on startup ───────────────────────────────────────
transporter.verify((error, success) => {
  if (error) {
    console.error('[SMTP] Zoho SMTP connection failed:', error.message);
    console.log('   -> Server will still run but emails will not be delivered until SMTP is resolved.');
  } else {
    console.log('[SMTP] Zoho SMTP server is ready -- emails will be sent from support@toyzguru.in');
  }
});

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ToyzGuru Email Server', port: PORT });
});

// ─── POST /send-email ─────────────────────────────────────────────────────────
// Body: { to: string, subject: string, html: string, text?: string }
app.post('/send-email', async (req, res) => {
  const { to, subject, html, text } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: to, subject, html',
    });
  }

  const mailOptions = {
    from: '"ToyzGuru" <support@toyzguru.in>',
    to,
    subject,
    html,
    text: text || '',
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧  Email sent to ${to} | Subject: "${subject}" | ID: ${info.messageId}`);
    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error(`❌  Failed to send email to ${to}:`, err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  ToyzGuru Email Server running at http://localhost:${PORT}`);
  console.log(`   POST http://localhost:${PORT}/send-email  →  Send transactional email`);
  console.log(`   GET  http://localhost:${PORT}/health       →  Health check\n`);
});

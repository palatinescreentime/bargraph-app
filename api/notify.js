// Vercel serverless function — email notification stub
// TODO: Install nodemailer and wire GMAIL_APP_PASSWORD to send real emails
// Required env vars: GMAIL_APP_PASSWORD

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, body } = req.body || {};

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
  }

  // Stub: log the email payload
  console.log('[notify] Email payload:', { to, subject, body });

  // TODO: Replace with real nodemailer implementation:
  // const nodemailer = require('nodemailer');
  // const transporter = nodemailer.createTransporter({
  //   service: 'gmail',
  //   auth: { user: 'jrgerberich@gmail.com', pass: process.env.GMAIL_APP_PASSWORD },
  // });
  // await transporter.sendMail({ from: 'jrgerberich@gmail.com', to, subject, text: body });

  return res.status(200).json({ ok: true, message: 'Email logged (stub)' });
}

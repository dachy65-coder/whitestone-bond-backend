const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Resend } = require('resend');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept']
}));
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => res.send('Whitestone Bond Mailer OK'));

app.post('/send-bond-application', upload.single('pdf'), async (req, res) => {
  try {
    const pdfBuffer = req.file?.buffer;
    const meta = JSON.parse(req.body.meta || '{}');

    if (!pdfBuffer) return res.status(400).json({ error: 'No PDF received' });

    const bizName = meta.bizName || 'Unknown Pharmacy';
    const bondType = meta.bondType || 'Pharmacy Bond';
    const bondAmt  = meta.bondAmt  || 'N/A';
    const refNum   = meta.refNum   || 'N/A';
    const submittedAt = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

    await resend.emails.send({
      from: 'Whitestone Bond Portal <onboarding@resend.dev>',
      to: 'dachy65@gmail.com',
      subject: `New Bond Application – ${bizName} [${refNum}]`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#0D2D5E;padding:20px 24px;border-radius:8px 8px 0 0">
            <h2 style="color:#fff;margin:0;font-size:18px">New Pharmacy Bond Application</h2>
            <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px">Whitestone Insurance Services LLC</p>
          </div>
          <div style="background:#f8f9fa;padding:20px 24px;border:1px solid #e0e0e0;border-top:none">
            <table style="width:100%;font-size:14px;border-collapse:collapse">
              <tr><td style="padding:6px 0;color:#666;width:40%">Reference #</td><td style="padding:6px 0;font-weight:600;color:#0D2D5E">${refNum}</td></tr>
              <tr style="border-top:1px solid #eee"><td style="padding:6px 0;color:#666">Business name</td><td style="padding:6px 0">${bizName}</td></tr>
              <tr style="border-top:1px solid #eee"><td style="padding:6px 0;color:#666">Bond type</td><td style="padding:6px 0">${bondType}</td></tr>
              <tr style="border-top:1px solid #eee"><td style="padding:6px 0;color:#666">Bond amount</td><td style="padding:6px 0;font-weight:600">${bondAmt}</td></tr>
              <tr style="border-top:1px solid #eee"><td style="padding:6px 0;color:#666">Submitted</td><td style="padding:6px 0">${submittedAt} ET</td></tr>
            </table>
          </div>
          <div style="background:#fff;padding:16px 24px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px">
            <p style="margin:0;font-size:13px;color:#888">Full application attached as PDF. Contact: info@wstone2.com · 929-292-8005</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `bond-application-${refNum}.pdf`,
          content: pdfBuffer.toString('base64'),
        },
      ],
    });

    res.json({ success: true, refNum });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bond mailer running on port ${PORT}`));


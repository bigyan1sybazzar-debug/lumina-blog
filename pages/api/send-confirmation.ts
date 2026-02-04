
export const runtime = 'edge';

import nodemailer from 'nodemailer';
import { db } from '../../services/firebase';

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Fetch SMTP settings from Firestore
    const smtpDoc = await db.collection('config').doc('smtp').get();

    if (!smtpDoc.exists) {
      return new Response(JSON.stringify({ error: 'SMTP not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const smtpSettings = smtpDoc.data();

    // Create transporter with SMTP settings
    // Note: nodemailer might require nodejs_compat in Cloudflare
    const transporter = nodemailer.createTransport({
      host: smtpSettings?.host || 'smtp.zoho.com',
      port: smtpSettings?.port || 465,
      secure: true,
      auth: {
        user: smtpSettings?.username,
        pass: smtpSettings?.password,
      },
    });

    // Send confirmation email
    await transporter.sendMail({
      from: `"${smtpSettings?.fromName || 'Bigyann Blog'}" <${smtpSettings?.username}>`,
      to: email,
      subject: 'Welcome to Bigyann Newsletter 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank You for Subscribing!</h1>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p>Welcome to Bigyann Newsletter! 🎉</p>
              <p>We're thrilled to have you as part of our community. You'll now receive:</p>
              <ul>
                <li>📰 Latest blog posts and articles</li>
                <li>💡 Exclusive tips and insights</li>
                <li>🎁 Special announcements and updates</li>
              </ul>
              <p>Stay tuned for amazing content coming your way!</p>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'}" class="button">Visit Our Blog</a>
            </div>
            <div class="footer">
              <p>You're receiving this because you subscribed to our newsletter.</p>
              <p>If you didn't subscribe, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return new Response(JSON.stringify({ success: true, message: 'Confirmation email sent' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({ error: 'Failed to send email', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

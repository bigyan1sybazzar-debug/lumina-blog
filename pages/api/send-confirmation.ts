import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import { db } from '../../services/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // Fetch SMTP settings from Firestore
        const smtpDoc = await db.collection('config').doc('smtp').get();

        if (!smtpDoc.exists) {
            return res.status(500).json({ error: 'SMTP not configured' });
        }

        const smtpSettings = smtpDoc.data();

        // Create transporter with SMTP settings
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

        return res.status(200).json({ success: true, message: 'Confirmation email sent' });
    } catch (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ error: 'Failed to send email', details: error });
    }
}

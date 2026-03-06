const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter - using Gmail as example
// For production, consider using services like SendGrid, AWS SES, etc.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    }
});

// Generate 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
async function sendOTPEmail(email, otp, shopName) {
    // DEVELOPMENT MODE: Skip email, show OTP in console
    if (process.env.SKIP_EMAIL === 'true' || !process.env.EMAIL_USER) {
        console.log('\n🔔 [DEV MODE - NO EMAIL SENT]');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📧 Email: ${email}`);
        console.log(`🔐 OTP Code: ${otp}`);
        console.log(`👤 Shop: ${shopName}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        return { success: true, messageId: 'dev-mode' };
    }
    const mailOptions = {
        from: process.env.EMAIL_USER || 'Cart Link <noreply@cartlink.com>',
        to: email,
        subject: 'Verify Your Shop Registration - Cart Link',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
                    .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🛍️ Cart Link</h1>
                        <p>Shop Registration Verification</p>
                    </div>
                    <div class="content">
                        <h2>Hello ${shopName}!</h2>
                        <p>Thank you for registering your shop on Cart Link. To complete your registration, please verify your email address.</p>
                        
                        <div class="otp-box">
                            <p style="margin: 0; font-size: 14px; color: #666;">Your verification code is:</p>
                            <div class="otp-code">${otp}</div>
                            <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">Valid for 10 minutes</p>
                        </div>
                        
                        <p><strong>Important:</strong></p>
                        <ul>
                            <li>This OTP is valid for 10 minutes only</li>
                            <li>Do not share this code with anyone</li>
                            <li>If you didn't request this, please ignore this email</li>
                        </ul>
                        
                        <p>Once verified, you'll be able to:</p>
                        <ul>
                            <li>✅ List your products</li>
                            <li>✅ Manage inventory</li>
                            <li>✅ Receive orders</li>
                            <li>✅ Track sales</li>
                        </ul>
                        
                        <div class="footer">
                            <p>This is an automated email. Please do not reply.</p>
                            <p>&copy; 2026 Cart Link. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✓ OTP email sent to:', email);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('✗ Error sending OTP email:', error);
        throw error;
    }
}

module.exports = {
    generateOTP,
    sendOTPEmail
};

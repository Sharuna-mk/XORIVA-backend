const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendEmail = async(email,otp)=>{
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP Code',
           html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:#000000;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:2px;">XORIVA</h1>
              <p style="margin:6px 0 0;color:#999;font-size:13px;letter-spacing:1px;">YOUR PREMIUM SHOPPING DESTINATION</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 48px;text-align:center;">
              <p style="margin:0 0 8px;font-size:16px;color:#555;">Hello there 👋</p>
              <h2 style="margin:0 0 24px;font-size:22px;color:#111;font-weight:700;">Your One-Time Password</h2>

              <!-- OTP Box -->
              <div style="background:#f4f4f5;border-radius:12px;padding:28px;margin:0 0 28px;">
                <p style="margin:0 0 10px;font-size:13px;color:#888;letter-spacing:1px;text-transform:uppercase;">Your OTP Code</p>
                <p style="margin:0;font-size:42px;font-weight:800;letter-spacing:10px;color:#000;">${otp}</p>
              </div>

              <p style="margin:0 0 6px;font-size:14px;color:#555;">This code expires in <strong>5 minutes</strong>.</p>
              <p style="margin:0;font-size:13px;color:#999;">If you didn't request this, you can safely ignore this email.</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 48px;">
              <div style="height:1px;background:#f0f0f0;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 48px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#bbb;">© ${new Date().getFullYear()} Xoriva. All rights reserved.</p>
              <p style="margin:6px 0 0;font-size:12px;color:#bbb;">This is an automated email, please do not reply.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
        });
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}
// const nodemailer = require('nodemailer');

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   }
// });

// exports.sendEmail = async (email, otp) => {
//   try {
//     await transporter.sendMail({
//       from: `"Xoriva" <${process.env.EMAIL_USER}>`,
//       to: email,
//       subject: 'Your OTP Code',
//       html: `
// <!DOCTYPE html>
// <html>
// <body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
//   <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
//     <tr>
//       <td align="center">
//         <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
//           <tr>
//             <td style="background:#000000;padding:32px;text-align:center;">
//               <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:2px;">XORIVA</h1>
//               <p style="margin:6px 0 0;color:#999;font-size:13px;letter-spacing:1px;">YOUR PREMIUM SHOPPING DESTINATION</p>
//             </td>
//           </tr>
//           <tr>
//             <td style="padding:40px 48px;text-align:center;">
//               <p style="margin:0 0 8px;font-size:16px;color:#555;">Hello there 👋</p>
//               <h2 style="margin:0 0 24px;font-size:22px;color:#111;font-weight:700;">Your One-Time Password</h2>
//               <div style="background:#f4f4f5;border-radius:12px;padding:28px;margin:0 0 28px;">
//                 <p style="margin:0 0 10px;font-size:13px;color:#888;letter-spacing:1px;text-transform:uppercase;">Your OTP Code</p>
//                 <p style="margin:0;font-size:42px;font-weight:800;letter-spacing:10px;color:#000;">${otp}</p>
//               </div>
//               <p style="margin:0 0 6px;font-size:14px;color:#555;">This code expires in <strong>5 minutes</strong>.</p>
//               <p style="margin:0;font-size:13px;color:#999;">If you didn't request this, you can safely ignore this email.</p>
//             </td>
//           </tr>
//           <tr>
//             <td style="padding:0 48px;">
//               <div style="height:1px;background:#f0f0f0;"></div>
//             </td>
//           </tr>
//           <tr>
//             <td style="padding:24px 48px;text-align:center;">
//               <p style="margin:0;font-size:12px;color:#bbb;">© ${new Date().getFullYear()} Xoriva. All rights reserved.</p>
//               <p style="margin:6px 0 0;font-size:12px;color:#bbb;">This is an automated email, please do not reply.</p>
//             </td>
//           </tr>
//         </table>
//       </td>
//     </tr>
//   </table>
// </body>
// </html>
//       `
//     });
//     console.log('Email sent successfully');
//   } catch (error) {
//     console.error('Error sending email:', error);
//     throw error;
//   }
// };


const nodemailer = require('nodemailer');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('[EMAIL] ❌ EMAIL_USER or EMAIL_PASS is not set');
}


function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: true,
    },
  
    family: 4,
  });
}

exports.sendEmail = async (to, otp) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email credentials not configured');
  }

  const transporter = createTransporter();

  try {
    const info = await transporter.sendMail({
      from: `"Xoriva" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Your OTP Code – Xoriva',
      html: buildEmailTemplate(otp),
    });
    console.log(`[EMAIL] ✓ Sent to ${to} | MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('[EMAIL] ❌ Failed:', {
      to,
      code: error.code,
      responseCode: error.responseCode,
      message: error.message,
    });
    throw error;
  }
};

exports.verifyEmailConnection = async () => {
  const transporter = createTransporter();
  try {
    await transporter.verify();
    console.log('[EMAIL] ✓ SMTP reachable on port 587');
  } catch (err) {
    console.error('[EMAIL] ❌ SMTP unreachable:', err.message);
  }
};

function buildEmailTemplate(otp) {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" 
          style="background:#ffffff;border-radius:16px;overflow:hidden;
                 box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#000000;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;
                         font-weight:800;letter-spacing:2px;">XORIVA</h1>
              <p style="margin:6px 0 0;color:#999;font-size:13px;">
                YOUR PREMIUM SHOPPING DESTINATION
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 48px;text-align:center;">
              <p style="margin:0 0 8px;font-size:16px;color:#555;">Hello there 👋</p>
              <h2 style="margin:0 0 24px;font-size:22px;color:#111;font-weight:700;">
                Your One-Time Password
              </h2>
              <div style="background:#f4f4f5;border-radius:12px;
                          padding:28px;margin:0 0 28px;">
                <p style="margin:0 0 10px;font-size:13px;color:#888;
                           text-transform:uppercase;">Your OTP Code</p>
                <p style="margin:0;font-size:42px;font-weight:800;
                           letter-spacing:10px;color:#000;">${otp}</p>
              </div>
              <p style="margin:0 0 6px;font-size:14px;color:#555;">
                This code expires in <strong>5 minutes</strong>.
              </p>
              <p style="margin:0;font-size:13px;color:#999;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 48px;">
              <div style="height:1px;background:#f0f0f0;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 48px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#bbb;">
                © ${new Date().getFullYear()} Xoriva. All rights reserved.
              </p>
              <p style="margin:6px 0 0;font-size:12px;color:#bbb;">
                This is an automated email, please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
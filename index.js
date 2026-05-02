// const dns = require('dns')
// dns.setServers(['1.1.1.1'])

// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const app = express();
// const router = require('./Route/routes');

// require('./config/db');
// const corsOptions = {
//   origin: [
//     "http://localhost:5173",
//     "http://localhost:3000",
//     "https://xoriva.vercel.app",
//   ],
//   methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true,
// };

// app.use(cors(corsOptions));
// app.use(express.json());
// app.use('/api', router);

// app.get('/', (req, res) => {
//   res.send('Hey!Welcome to XORIVA');
// });

// // In your main index.js or any router file — TEMPORARY
// app.get('/test-email', async (req, res) => {
//   const results = {
//     env: {
//       EMAIL_USER: process.env.EMAIL_USER ?? 'MISSING',
//       EMAIL_PASS_SET: !!process.env.EMAIL_PASS,
//       EMAIL_PASS_LENGTH: process.env.EMAIL_PASS?.length ?? 0,
//       NODE_ENV: process.env.NODE_ENV ?? 'not set',
//     },
//     smtp: null,
//     send: null,
//   };

//   // Test 1: Can we reach Gmail SMTP?
//   const nodemailer = require('nodemailer');
//   const transporter = nodemailer.createTransport({
//     host: 'smtp.gmail.com',
//     port: 587,
//     secure: false,
//     requireTLS: true,
//     family: 4,
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//     tls: {
//       rejectUnauthorized: true,
//     },
//   });

//   try {
//     await transporter.verify();
//     results.smtp = '✓ SMTP connection successful';
//   } catch (err) {
//     results.smtp = `❌ SMTP failed: ${err.message} (code: ${err.code})`;
//   }

//   // Test 2: Can we actually send?
//   try {
//     const info = await transporter.sendMail({
//       from: `"Xoriva Test" <${process.env.EMAIL_USER}>`,
//       to: process.env.EMAIL_USER, // send to yourself
//       subject: 'Render Email Test',
//       text: `Test email from Render at ${new Date().toISOString()}`,
//     });
//     results.send = `✓ Email sent! MessageId: ${info.messageId}`;
//   } catch (err) {
//     results.send = `❌ Send failed: ${err.message} (code: ${err.code}, responseCode: ${err.responseCode})`;
//   }

//   res.json(results);
// });

// const port = process.env.PORT || 3000;


// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });



const dns = require('dns');
dns.setServers(['1.1.1.1'])


require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const router = require('./Route/routes');

require('./config/db');

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://xoriva.vercel.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/api', router);

app.get('/', (req, res) => {
  res.send('Hey! Welcome to XORIVA');
});

// TEMPORARY TEST ROUTE
app.get('/test-email', async (req, res) => {
  const results = {
    env: {
      EMAIL_USER: process.env.EMAIL_USER ?? 'MISSING',
      EMAIL_PASS_SET: !!process.env.EMAIL_PASS,
      EMAIL_PASS_LENGTH: process.env.EMAIL_PASS?.length ?? 0,
      NODE_ENV: process.env.NODE_ENV ?? 'not set',
    },
    smtp: null,
    send: null,
    resolvedIP: null,  // ← we'll log which IP Gmail resolves to
  };

  const dns = require('dns').promises;
  const nodemailer = require('nodemailer');

  // Check which IP Gmail is resolving to
  try {
    const addresses = await dns.resolve4('smtp.gmail.com');
    results.resolvedIP = addresses[0]; // should be 142.x.x.x (IPv4)
  } catch (err) {
    results.resolvedIP = `DNS resolve failed: ${err.message}`;
  }

  const transporter = nodemailer.createTransport({

    host: '173.194.43.108',
    port: 587,
    secure: false,
    requireTLS: true,
    family: 4,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: true,
      servername: 'smtp.gmail.com', // ← required when using IP instead of hostname
    },
  });

  try {
    await transporter.verify();
    results.smtp = '✓ SMTP connection successful';
  } catch (err) {
    results.smtp = `❌ SMTP failed: ${err.message} (code: ${err.code})`;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Xoriva Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: 'Render Email Test',
      text: `Test email from Render at ${new Date().toISOString()}`,
    });
    results.send = `✓ Email sent! MessageId: ${info.messageId}`;
  } catch (err) {
    results.send = `❌ Send failed: ${err.message} (code: ${err.code}, responseCode: ${err.responseCode})`;
  }

  res.json(results);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
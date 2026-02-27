// require('dotenv').config(); // Env vars are provided by Docker
import nodemailer from 'nodemailer';

async function main() {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || '',
    port: parseInt(process.env.MAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USER || '',
      pass: process.env.MAIL_PASSWORD || '',
    },
    debug: true,
    logger: true,
  });

  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM, // sender address
    to: 'placancifuentes@gmail.com', // list of receivers
    subject: 'Hello ✔Test Email', // Subject line
    text: 'Hello world?', // plain text body
    html: '<b>Hello world?</b>', // html body
  });

  console.log('Message sent: %s', info.messageId);
}

main().catch(console.error);

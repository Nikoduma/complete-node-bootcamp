const nodemailer = require('nodemailer');
const catchAsync = require('./catchAsync');

const sendEmail = catchAsync(async options => {
  // 1) Create the transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_SMTP_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  // 2) Define the email options
  const mailOption = {
    from: 'Nico <nico@fico.it>',
    to: options.email,
    subject: options.subject,
    text: options.message
    // html:
  };
  // 3) send the email
  await transporter.sendMail(mailOption);
});

module.exports = sendEmail;

import nodemailer from 'nodemailer';

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

export const sendEmail = async (options: EmailOptions) => {
  // 1) Create a transporter (Mock using ethereal or console.log for development)
  // For production, configure SMTP host, port, auth properly.
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
    port: Number(process.env.EMAIL_PORT) || 2525,
    auth: {
      user: process.env.EMAIL_USERNAME || 'testuser',
      pass: process.env.EMAIL_PASSWORD || 'testpass',
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: 'BizManage Admin <admin@bizmanage.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

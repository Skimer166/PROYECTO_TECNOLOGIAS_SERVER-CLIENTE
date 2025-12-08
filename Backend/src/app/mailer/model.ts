import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const mailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
const mailPort = Number(process.env.EMAIL_PORT) || 587;
const mailUser = process.env.EMAIL_USER;
const mailPass = process.env.EMAIL_PASSWORD;

if (!mailUser || !mailPass) {
  console.warn('[MAILER] Faltan variables EMAIL_USER o EMAIL_PASSWORD. El correo no funcionará.');
}

export const mailer = nodemailer.createTransport({
  host: mailHost,
  port: mailPort,
  secure: mailPort === 465, 
  auth: {
    user: mailUser,
    pass: mailPass,
  },
  tls: {
    rejectUnauthorized: false
  }
});

mailer.verify()
  .then(() => {
    console.log('[MAILER] Servidor de correo listo y conectado.');
  })
  .catch((error) => {
    console.error('[MAILER] Error de conexión SMTP:', error);
  });
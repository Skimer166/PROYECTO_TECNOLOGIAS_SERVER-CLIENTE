import { Request, Response } from "express";
import { mailer } from "./model";
import { Options } from "nodemailer/lib/mailer";

export function sendEmail(req: Request, res: Response) {
    const mailOptions = {
        from: process.env.EMAIL_USER || '',
        to: (req.query.email as string),
        subject: 'Tienes un nuevo correo',
        html: '<p>ObjectLockLegalHoldStatus, este es un correo de ejemplo</p>',
        text: 'Hola, este es el texto plano',
        //attachments:[]
    }

    mailer.sendMail(mailOptions).then(()=> {
        res.send('Correo enviado')
    }).catch((error) => {
        console.error('Error al enviar correo:', error);
        res.send('Error: ' + error);
    })

}

export async function sendWelcomeEmail(to: string, name: string) {
  const mailOptions: Options = {
    from: process.env.EMAIL_USER || "",
    to,
    subject: "¡Bienvenido a Market-AI!",
    html: `<p>Hola <strong>${name}</strong>,</p>
           <p>¡Gracias por registrarte en Market-AI!</p>
           <p>Ya puedes iniciar sesión y comenzar a usar la plataforma.</p>`,
    text: `Hola ${name},\n\nGracias por registrarte en Market-AI.\nYa puedes iniciar sesión y comenzar a usar la plataforma.`,
  };

  await mailer.sendMail(mailOptions);
}


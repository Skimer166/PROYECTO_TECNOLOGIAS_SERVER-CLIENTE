import { Request, Response } from "express";
import { mailer } from "./model";
import { Options } from "nodemailer/lib/mailer"

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


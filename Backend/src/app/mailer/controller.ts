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
    subject: "Bienvenido a Market-AI",
    html: `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Bienvenido a Market-AI</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:24px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
            <tr>
              <td style="background:linear-gradient(135deg, #1e1e2f, #3a0ca3, #7209b7, #f72585);padding:24px 32px;color:#ffffff;">
                <h1 style="margin:0;font-size:24px;font-weight:700;">Market-AI</h1>
                <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">Tu asistente inteligente para el marketplace.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;color:#111827;font-size:14px;line-height:1.6;">
                <p style="margin:0 0 12px;">Hola <strong>${name}</strong>,</p>
                <p style="margin:0 0 12px;">¡Gracias por registrarte en <strong>Market-AI</strong>!</p>
                <p style="margin:0 0 16px;">
                  Ya puedes iniciar sesión en la plataforma, crear agentes y empezar a aprovechar las herramientas de inteligencia artificial para tu negocio.
                </p>
                <p style="margin:0 0 24px;">Te recomendamos:</p>
                <ul style="margin:0 0 24px 18px;padding:0;color:#374151;">
                  <li>Completar tu perfil de usuario.</li>
                  <li>Explorar los agentes disponibles y marcar tus favoritos.</li>
                  <li>Probar el chat de soporte si tienes dudas.</li>
                </ul>
                <p style="margin:0 0 4px;color:#6b7280;font-size:12px;">
                  Si tú no creaste esta cuenta, puedes ignorar este correo.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:11px;text-align:center;">
                © ${new Date().getFullYear()} Market-AI. Todos los derechos reservados.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    text: `Hola ${name},

Gracias por registrarte en Market-AI.

Ya puedes iniciar sesión en la plataforma, crear agentes y empezar a usarlos en tu negocio.

Si tú no creaste esta cuenta, puedes ignorar este correo.

© ${new Date().getFullYear()} Market-AI.`,
  };

  await mailer.sendMail(mailOptions);
}


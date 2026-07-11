import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!env.smtpHost || !env.smtpUser) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });
  }

  return transporter;
}

type ContactPayload = {
  nombre: string;
  telefono: string;
  correo?: string;
  mensaje: string;
};

export async function sendContactEmail(payload: ContactPayload) {
  const client = getTransporter();

  if (!client) {
    throw new Error('El envio de correo no esta configurado en el servidor todavia.');
  }

  const text = [
    `Nombre: ${payload.nombre}`,
    `Telefono: ${payload.telefono}`,
    payload.correo ? `Correo: ${payload.correo}` : null,
    '',
    payload.mensaje,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');

  await client.sendMail({
    from: env.contactFromEmail,
    to: env.contactToEmail,
    replyTo: payload.correo || undefined,
    subject: `Nuevo mensaje de contacto - ${payload.nombre}`,
    text,
  });
}

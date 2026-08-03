import nodemailer from "nodemailer";

const isProd = process.env.NODE_ENV === "production";
const SMTP_HOST = process.env.SMTP_HOST || "smtp.hostinger.com";
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM;
const APP_URL = process.env.APP_URL || "http://localhost:3001";

if (isProd && (!SMTP_USER || !SMTP_PASSWORD)) {
  throw new Error("SMTP_USER e SMTP_PASSWORD devem estar definidas em producao.");
}
if (isProd && !EMAIL_FROM) {
  throw new Error("EMAIL_FROM deve estar definida em producao (ex: 'Financa Familiar <noreply@meucontrole.cloud>').");
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
});

export async function sendInviteEmail(email: string, token: string): Promise<void> {
  const link = `${APP_URL}/criar-conta?token=${token}`;
  await transporter.sendMail({
    from: EMAIL_FROM,
    to: email,
    subject: "Convite - Financa Familiar",
    html: `<p>Voce foi convidado para o Financa Familiar.</p><p><a href="${link}">Clique aqui para criar sua conta</a></p><p>Este link expira em 7 dias.</p>`,
  });
}

export async function sendResetPasswordEmail(email: string, token: string): Promise<void> {
  const link = `${APP_URL}/redefinir-senha?token=${token}`;
  await transporter.sendMail({
    from: EMAIL_FROM,
    to: email,
    subject: "Redefinir senha - Financa Familiar",
    html: `<p>Clique no link abaixo para definir uma nova senha.</p><p><a href="${link}">Redefinir senha</a></p><p>Este link expira em 1 hora. Se voce nao pediu isso, ignore este email.</p>`,
  });
}

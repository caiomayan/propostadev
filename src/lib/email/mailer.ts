import "server-only";
import { after } from "next/server";
import nodemailer from "nodemailer";

/** `preview`: o link ou código, impresso só em desenvolvimento, quando não há SMTP. */
export type OutgoingEmail = { to: string; subject: string; text: string; html: string; preview: string };

type Env = Record<string, string | undefined>;
export function smtpConfigured(env: Env = process.env) {
  return Boolean(env.SMTP_USER?.trim() && env.SMTP_PASS?.trim());
}
// Em desenvolvimento e teste, sem SMTP, o link ou código vai para o console. Em produção sem SMTP,
// nenhum e-mail é enviado nem logado e os fluxos que dependem dele não são oferecidos.
export function emailAvailable(env: Env = process.env) {
  return smtpConfigured(env) || env.NODE_ENV !== "production";
}
export function smtpSettings(env: Env = process.env) {
  const user = env.SMTP_USER?.trim() ?? "";
  const port = Number(env.SMTP_PORT) || 465;
  return { host: env.SMTP_HOST?.trim() || "smtp.gmail.com", port, secure: port === 465, auth: { user, pass: env.SMTP_PASS ?? "" }, from: env.EMAIL_FROM?.trim() || user };
}

async function deliver(message: OutgoingEmail) {
  if (smtpConfigured()) {
    const { from, ...transport } = smtpSettings();
    await nodemailer.createTransport(transport).sendMail({ from: `Proposta.dev <${from}>`, to: message.to, subject: message.subject, text: message.text, html: message.html });
    return;
  }
  if (process.env.NODE_ENV !== "production") console.info(`[e-mail em desenvolvimento] Para: ${message.to} | Assunto: ${message.subject}\n${message.preview}`);
}

// A entrega roda depois da resposta (after) para que o tempo de resposta não diferencie
// e-mails cadastrados de não cadastrados. Falhas nunca expõem token nem senha no log.
export function sendEmail(message: OutgoingEmail) {
  const task = () => deliver(message).catch((error: unknown) => { console.error("Falha ao enviar e-mail transacional:", error instanceof Error ? error.message : "erro desconhecido"); });
  try { after(task); } catch { void task(); }
}

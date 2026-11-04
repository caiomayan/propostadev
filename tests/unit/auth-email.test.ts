import { afterEach, describe, expect, it, vi } from "vitest";

const sendMail = vi.hoisted(() => vi.fn<(message: unknown) => Promise<unknown>>(async () => ({})));
const createTransport = vi.hoisted(() => vi.fn<(options: unknown) => { sendMail: typeof sendMail }>(() => ({ sendMail })));
vi.mock("nodemailer", () => ({ default: { createTransport } }));
import { emailAvailable, sendEmail, smtpConfigured, smtpSettings } from "../../src/lib/email/mailer";
import { passwordResetEmail, verificationCodeEmail } from "../../src/lib/email/templates";
import { passwordStrength } from "../../src/lib/auth/password-strength";

const message = { to: "pessoa@example.test", subject: "Assunto", text: "texto", html: "<p>html</p>", preview: "https://app.test/reset?token=SEGREDO-TOKEN" };
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); sendMail.mockClear(); createTransport.mockClear(); });

describe("e-mail transacional", () => {
  it("padrões: smtp.gmail.com, porta 465 e remetente igual ao SMTP_USER", () => {
    expect(smtpSettings({ SMTP_USER: "app@example.test", SMTP_PASS: "x" })).toMatchObject({ host: "smtp.gmail.com", port: 465, secure: true, from: "app@example.test" });
    expect(smtpSettings({ SMTP_USER: "app@example.test", SMTP_PASS: "x", SMTP_HOST: "smtp.test", SMTP_PORT: "587", EMAIL_FROM: "no-reply@example.test" })).toMatchObject({ host: "smtp.test", port: 587, secure: false, from: "no-reply@example.test" });
  });
  it("recuperação só é oferecida em produção quando há SMTP; em desenvolvimento sempre", () => {
    expect(smtpConfigured({ SMTP_USER: "u" })).toBe(false);
    expect(emailAvailable({ NODE_ENV: "production" })).toBe(false);
    expect(emailAvailable({ NODE_ENV: "production", SMTP_USER: "u", SMTP_PASS: "p" })).toBe(true);
    expect(emailAvailable({ NODE_ENV: "development" })).toBe(true);
  });
  it("sem SMTP em desenvolvimento, o link vai para o console e nada é enviado", async () => {
    vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("SMTP_USER", ""); vi.stubEnv("SMTP_PASS", "");
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    sendEmail(message);
    await vi.waitFor(() => expect(info).toHaveBeenCalled());
    expect(String(info.mock.calls[0][0])).toContain(message.preview);
    expect(createTransport).not.toHaveBeenCalled();
  });
  it("sem SMTP em produção, nem envia nem registra o token", async () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("SMTP_USER", ""); vi.stubEnv("SMTP_PASS", "");
    const spies = [vi.spyOn(console, "info"), vi.spyOn(console, "log"), vi.spyOn(console, "error"), vi.spyOn(console, "warn")].map((spy) => spy.mockImplementation(() => {}));
    sendEmail(message);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(createTransport).not.toHaveBeenCalled();
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });
  it("com SMTP, envia pelo transporte configurado", async () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("SMTP_USER", "app@example.test"); vi.stubEnv("SMTP_PASS", "senha-smtp"); vi.stubEnv("SMTP_HOST", ""); vi.stubEnv("SMTP_PORT", ""); vi.stubEnv("EMAIL_FROM", "");
    sendEmail(message);
    await vi.waitFor(() => expect(sendMail).toHaveBeenCalled());
    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({ host: "smtp.gmail.com", port: 465, secure: true }));
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ from: "Proposta.dev <app@example.test>", to: message.to }));
  });
  it("falha de envio não vaza o token no log", async () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("SMTP_USER", "app@example.test"); vi.stubEnv("SMTP_PASS", "senha-smtp");
    sendMail.mockRejectedValueOnce(new Error("conexão recusada"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    sendEmail(message);
    await vi.waitFor(() => expect(error).toHaveBeenCalled());
    expect(JSON.stringify(error.mock.calls)).not.toContain("SEGREDO-TOKEN");
  });
  it("templates em pt-BR com a marca e o nome escapado", () => {
    const reset = passwordResetEmail("<b>Ana</b>", "https://app.test/r?token=abc&x=1");
    expect(reset.subject).toContain("Proposta.dev");
    expect(reset.html).toContain("Proposta");
    expect(reset.html).not.toContain("<b>Ana</b>");
    expect(reset.html).toContain("&lt;b&gt;Ana");
    expect(reset.text).toContain("https://app.test/r?token=abc&x=1");
    expect(reset.text).toContain("1 hora");
    const confirmation = verificationCodeEmail("482913");
    expect(confirmation.subject).toContain("482913");
    expect(confirmation.html).toContain("482913");
    expect(confirmation.text).toContain("10 minutos");
    expect(confirmation.html).not.toContain("href");
  });
});

describe("indicador de força da senha", () => {
  it("segue a regra de 12 a 128 caracteres", () => {
    expect(passwordStrength("").valid).toBe(false);
    expect(passwordStrength("a".repeat(11))).toMatchObject({ valid: false, label: "Muito curta" });
    expect(passwordStrength("a".repeat(12)).valid).toBe(true);
    expect(passwordStrength("a".repeat(128)).valid).toBe(true);
    expect(passwordStrength("a".repeat(129))).toMatchObject({ valid: false, level: 0 });
  });
  it("gradua senhas válidas por variedade e comprimento", () => {
    expect(passwordStrength("aaaaaaaaaaaa").level).toBe(2);
    expect(passwordStrength("correto cavalo bateria grampo").level).toBe(4);
    expect(passwordStrength("Senha-Boa-12").level).toBeGreaterThanOrEqual(3);
  });
});

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

function layout(title: string, name: string, paragraphs: string[], action: string, link: string, footer: string) {
  const body = paragraphs.map((text) => `<p style="margin:0 0 16px;line-height:1.6">${escapeHtml(text)}</p>`).join("");
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;padding:24px;background:#f1f3ec;font-family:Arial,Helvetica,sans-serif;color:#10231a"><div style="max-width:520px;margin:0 auto;background:#fafbf6;border-radius:18px;padding:32px"><p style="margin:0 0 24px;font-size:20px;font-weight:700;color:#0f3d2e">Proposta<span style="background:#d4f25a;color:#10231a;padding:0 4px;border-radius:4px">.dev</span></p><h1 style="margin:0 0 16px;font-size:22px">${escapeHtml(title)}</h1><p style="margin:0 0 16px;line-height:1.6">Olá, ${escapeHtml(name)}.</p>${body}<p style="margin:24px 0"><a href="${escapeHtml(link)}" style="display:inline-block;background:#0f3d2e;color:#f1f3ec;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:999px">${escapeHtml(action)}</a></p><p style="margin:0 0 8px;font-size:13px;color:#46574d;word-break:break-all">Se o botão não funcionar, copie este endereço: ${escapeHtml(link)}</p><p style="margin:0;font-size:13px;color:#46574d">${escapeHtml(footer)}</p></div></body></html>`;
  const text = [`Proposta.dev — ${title}`, "", `Olá, ${name}.`, "", ...paragraphs.flatMap((paragraph) => [paragraph, ""]), `${action}: ${link}`, "", footer].join("\n");
  return { html, text };
}

export function passwordResetEmail(name: string, link: string) {
  const footer = "Se você não pediu a redefinição, ignore este e-mail: sua senha continua a mesma.";
  return { subject: "Redefinir sua senha na Proposta.dev", ...layout("Redefinir senha", name, ["Recebemos um pedido para redefinir a senha da sua conta.", "O link vale por 1 hora e só pode ser usado uma vez. Ao redefinir, as outras sessões abertas são encerradas."], "Redefinir senha", link, footer) };
}
export function verificationEmail(name: string, link: string) {
  const footer = "Se você não criou uma conta na Proposta.dev, ignore este e-mail.";
  return { subject: "Confirme seu e-mail na Proposta.dev", ...layout("Confirme seu e-mail", name, ["Confirme seu e-mail para manter a conta protegida e receber avisos importantes.", "Você pode continuar usando a plataforma mesmo antes de confirmar."], "Confirmar e-mail", link, footer) };
}

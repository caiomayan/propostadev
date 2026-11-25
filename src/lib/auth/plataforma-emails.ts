// Equipe da plataforma (ADR 0005, decisão 2): lista de e-mails em PLATAFORMA_EMAILS, sem papel no banco.
// Módulo puro (sem server-only) para ser testado; o acesso de verdade fica em plataforma.ts.

/** Lê a lista separada por vírgula: ignora espaços e entradas vazias, compara sem caixa. */
export function parsePlataformaEmails(raw: string | undefined | null): string[] {
  return (raw ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
}

type UserLike = { email?: string | null; emailVerified?: boolean | null };

/** Só vale e-mail confirmado de verdade (não a regra branda de needsEmailConfirmation, que libera quando não há SMTP). */
export function isPlataformaUser(user: UserLike | null | undefined, raw: string | undefined | null = process.env.PLATAFORMA_EMAILS): boolean {
  if (!user?.email || user.emailVerified !== true) return false;
  return parsePlataformaEmails(raw).includes(user.email.trim().toLowerCase());
}

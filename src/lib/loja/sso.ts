import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// Login único da loja WooCommerce (ADR 0006): o site confirma quem é a pessoa (e-mail verificado, inclusive pelo Google)
// e entrega à loja um token curto, assinado com LOJA_SSO_SECRET e de uso único. A loja confere a assinatura em PHP.
// Formato: base64url(JSON {e, n, x, j}) + "." + base64url(HMAC-SHA256(payload)).
export type LojaIdentity = { email: string; name: string };
const TTL_SECONDS = 120;

const b64 = (value: Buffer | string) => Buffer.from(value).toString("base64url");
const sign = (payload: string, secret: string) => b64(createHmac("sha256", secret).update(payload).digest());

export function signLojaToken(identity: LojaIdentity, secret: string, nowMs: number): string {
  const payload = b64(JSON.stringify({ e: identity.email, n: identity.name, x: Math.floor(nowMs / 1000) + TTL_SECONDS, j: randomBytes(12).toString("hex") }));
  return `${payload}.${sign(payload, secret)}`;
}

// Usado nos testes para fixar o formato que a loja valida.
export function verifyLojaToken(token: string, secret: string, nowMs: number): LojaIdentity | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { e: string; n: string; x: number };
    return data.x >= Math.floor(nowMs / 1000) ? { email: data.e, name: data.n } : null;
  } catch { return null; }
}

// Para onde voltar na loja: só caminhos internos dela.
export function lojaReturnPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\u0000-\u001f]/.test(value)) return "/minha-conta/";
  return value;
}

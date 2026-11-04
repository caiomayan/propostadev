// O token de login do Google pode vir sem a foto. A rota de perfil, com o token de acesso, é a fonte confiável.
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

/** Foto atual da conta Google, ou null. Uma falha aqui nunca pode impedir o login. */
export async function fetchGooglePicture(accessToken: string, request: typeof fetch = fetch) {
  try {
    const response = await request(USERINFO_URL, { headers: { authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(3000) });
    if (!response.ok) return null;
    const { picture } = await response.json() as { picture?: unknown };
    return typeof picture === "string" && picture.startsWith("https://") ? picture : null;
  } catch { return null; }
}

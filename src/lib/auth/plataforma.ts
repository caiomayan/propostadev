import "server-only";
import { notFound } from "next/navigation";
import { getSession } from "./session";
import { isPlataformaUser } from "./plataforma-emails";

/** Página: quem não é da Equipe recebe 404, para não revelar que o painel existe. */
export async function requirePlataforma() {
  const session = await getSession();
  if (!isPlataformaUser(session?.user)) notFound();
  return session!;
}

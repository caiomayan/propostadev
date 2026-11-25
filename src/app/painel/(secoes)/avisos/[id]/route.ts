import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { openAviso } from "@/modules/avisos/queries";

/** Abrir um Aviso o marca como lido (só o do usuário da sessão) e leva ao destino. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/entrar", request.url));
  const { id } = await params;
  return NextResponse.redirect(new URL(await openAviso(session.user.id, id), request.url));
}

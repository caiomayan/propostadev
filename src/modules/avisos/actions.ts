"use server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { mutationAllowed } from "@/lib/auth/mutation-limit";
import { markAllRead } from "./queries";

/** O usuário vem da sessão; o formulário não informa nada. */
export async function markAllAvisosRead(): Promise<void> {
  const session = await getSession();
  if (!session || !await mutationAllowed(session.user.id, "aviso")) return;
  await markAllRead(session.user.id);
  // O sino fica no cabeçalho do layout raiz: revalida o layout inteiro para o número atualizar.
  revalidatePath("/", "layout");
}

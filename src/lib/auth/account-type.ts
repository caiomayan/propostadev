import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/auth-schema";
import { needsEmailConfirmation } from "./email-gate";
import type { AccountType } from "./user-fields";

// Define o tipo de conta uma única vez. O UPDATE condicional recusa tipo já definido;
// o trigger user_tipo_conta_imutavel garante o mesmo no banco.
export async function setAccountType(userId: string, type: AccountType) {
  const changed = await db.update(user).set({ tipo_conta: type }).where(and(eq(user.id, userId), isNull(user.tipo_conta))).returning({ id: user.id });
  return changed.length === 1;
}

type SessionLike = { user: { id: string; accountType?: string | null; emailVerified?: boolean | null } } | null;

// Para Server Actions: devolve a mensagem de recusa ou null quando a sessão pode agir.
export function accountTypeDenial(session: SessionLike, required: AccountType): string | null {
  if (!session) return "Entre para continuar.";
  const type = session.user.accountType;
  if (!type) return "Escolha o tipo da sua conta antes de continuar.";
  if (type !== required) return required === "PRESTADOR" ? "Esta ação é exclusiva de contas de Prestador." : "Esta ação é exclusiva de contas de Cliente.";
  if (needsEmailConfirmation(session.user)) return "Confirme seu e-mail para continuar.";
  return null;
}

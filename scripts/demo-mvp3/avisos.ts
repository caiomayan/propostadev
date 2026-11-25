// Avisos de demonstração (extras do MVP 3, ADR 0005) para prestador1 e cliente1, a partir dos Convites e Propostas que já existem.
// Idempotente e só aditivo: um Aviso por (usuário, tipo, Projeto); rodar de novo não duplica nem desfaz leituras.
// Contas identificadas pelo e-mail de login. Avisos de decisões antigas (aceita, recusada) entram lidos; os demais, não lidos.
import { sql } from "drizzle-orm";
import { db } from "../../src/lib/db";

export const demoAvisoEmails = { prestador: "prestador1@demo.example", cliente: "cliente1@demo.example" } as const;

export async function seedDemoAvisos(): Promise<void> {
  // Convites recebidos e decisões sobre as Propostas do prestador1.
  await db.execute(sql`
    INSERT INTO aviso (usuario_id, tipo, projeto_id, created_at, lido_em)
    SELECT src.usuario_id, src.tipo::aviso_tipo, src.projeto_id, src.quando, CASE WHEN src.tipo IN ('PROPOSTA_ACEITA', 'PROPOSTA_RECUSADA') THEN src.quando END
    FROM (
      SELECT pf.usuario_id, 'CONVITE_RECEBIDO' AS tipo, c.projeto_id, c.created_at AS quando
        FROM convite c JOIN perfil_prestador pf ON pf.id = c.prestador_id JOIN "user" u ON u.id = pf.usuario_id WHERE u.email = ${demoAvisoEmails.prestador}
      UNION ALL
      SELECT pf.usuario_id, 'PROPOSTA_' || CASE pr.status WHEN 'PRE_SELECIONADA' THEN 'PRE_SELECIONADA' WHEN 'ACEITA' THEN 'ACEITA' ELSE 'RECUSADA' END, pr.projeto_id, pr.updated_at
        FROM proposta pr JOIN perfil_prestador pf ON pf.id = pr.prestador_id JOIN "user" u ON u.id = pf.usuario_id
        WHERE u.email = ${demoAvisoEmails.prestador} AND pr.status IN ('PRE_SELECIONADA', 'ACEITA', 'RECUSADA')
      UNION ALL
      -- Propostas recebidas nos Projetos do cliente1 (retiradas não contam).
      SELECT p.cliente_id, 'PROPOSTA_RECEBIDA', pr.projeto_id, pr.created_at
        FROM proposta pr JOIN projeto p ON p.id = pr.projeto_id JOIN "user" u ON u.id = p.cliente_id WHERE u.email = ${demoAvisoEmails.cliente} AND pr.status <> 'RETIRADA'
    ) src
    WHERE NOT EXISTS (SELECT 1 FROM aviso a WHERE a.usuario_id = src.usuario_id AND a.tipo = src.tipo::aviso_tipo AND a.projeto_id = src.projeto_id)`);
}

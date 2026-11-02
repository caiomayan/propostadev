import { randomUUID } from "node:crypto";

type Queryable = { query: (sql: string, params?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }> };

/**
 * Dá ao Cliente um Aceite do Prestador: Projeto ENCERRADO do Cliente + Proposta ACEITA do Prestador + Projeto apontando para ela.
 * É o que a regra da Avaliação verificada exige (ticket 07). Cada chamada cria um Projeto novo, então dá para chamar duas vezes
 * para o mesmo par e provar que os agregados não duplicam. O Tipo de serviço pode ser qualquer um existente.
 */
export async function grantAcceptance(db: Queryable, clientId: string, providerId: string, serviceTypeId?: string) {
  const type = serviceTypeId ?? String((await db.query("SELECT id FROM tipo_servico LIMIT 1")).rows[0]?.id);
  const project = randomUUID(), proposal = randomUUID();
  await db.query("INSERT INTO projeto(id,cliente_id,tipo_servico_id,titulo,descricao,orcamento_tipo,orcamento_max,prazo_desejado_dias,status) VALUES($1,$2,$3,'Projeto com aceite','Descrição suficiente para o projeto de teste do banco.','ATE',3000,30,'ENCERRADO')", [project, clientId, type]);
  await db.query("INSERT INTO proposta(id,projeto_id,prestador_id,valor,prazo_dias,mensagem,status) VALUES($1,$2,$3,2000,30,'Posso entregar esta página com testes, revisão de conteúdo e acompanhamento.','ACEITA')", [proposal, project, providerId]);
  await db.query("UPDATE projeto SET proposta_aceita_id=$1 WHERE id=$2", [proposal, project]);
  return { projectId: project, proposalId: proposal };
}

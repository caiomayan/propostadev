# ADR 0001 — MVP monolítico de descoberta
Status: aceito como baseline de implementação.

## Contexto
Modelo original cobria contratação/triagem/propostas. A entrevista definiu primeira versão semelhante a classificados, com cliente e prestador na mesma conta. Next/TS/PostgreSQL Docker são preferências explícitas do usuário.

## Decisão
Next.js monolítico modular. Conta auth + perfil prestador opcional. Catálogo central → ofertas próprias. Avaliação aberta com divulgação de contratação não verificada. Contato externo. Drizzle torna schema/migrations legíveis e Better Auth evita auth artesanal. Sem serviços adicionais obrigatórios.

## Consequências
Menor escopo, contratos de dados definidos, backend junto ao frontend. Não há garantia de contratação/reputação verificada. PJ só tem uma conta responsável. Estatística representa preços anunciados FIXO comparáveis, não estimativa automática de demanda. Recuperação/verificação email e moderação precisam ser endereçadas para lançamento público posterior.

## Evolução
Propostas, demandas, pagamentos e triagem só entram após nova especificação; não manter tabelas vazias antecipadas. Mudanças documentadas em novos ADRs com efeitos sobre testes e migrations.

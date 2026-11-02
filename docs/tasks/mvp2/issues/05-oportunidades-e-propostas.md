# 05: Oportunidades e Propostas do Prestador (com Convites)

**What to build:** o Prestador com Perfil e Oferta ativos vê os Projetos abertos dos seus Tipos de serviço, com os convidados primeiro. No detalhe vê o Preço de referência, envia, edita ou retira uma Proposta e acompanha todas em "Minhas propostas". O Cliente convida até 10 Prestadores compatíveis a partir do resultado da Triagem ou do Projeto.

**Blocked by:** 04

**Status:** done

- [x] Tabelas proposta e convite com UNIQUE e checks — drizzle/0004_propostas-convites.sql (UNIQUE projeto+prestador, índice único parcial de ACEITA, checks, FK proposta_aceita_id SET NULL, convite UNIQUE); coberto em tests/integration/proposals.test.ts ("banco: ...")
- [x] Testes: uma Proposta por par, edição só em estados permitidos, Prestador sem Oferta no tipo não vê nem propõe — tests/integration/proposals.test.ts (Proposta, Oportunidades, Convites); E2E tests/e2e/proposals.spec.ts
- [x] E-mail do Cliente nunca exposto antes do Aceite — as queries do Prestador só selecionam o primeiro nome (split_part) e o teste confere que e-mail, sobrenome e id do Cliente não aparecem; o E2E confere a tela. O Aceite é do ticket 06
- [x] Contador de Propostas no painel do Cliente — painel, Meus projetos e detalhe (ENVIADA + PRE_SELECIONADA); teste de integração e E2E. Convites: dono de Projeto ABERTO, só compatíveis, limite 10 (inclusive concorrente). Browser do Orca em 375 e 1440: ver relatório do worker

# 04: Triagem com Preço de referência, Prestadores compatíveis e publicação de Projeto

**What to build:** a partir da home, qualquer pessoa faz a Triagem:
1. escolhe o objetivo em linguagem simples ou o Tipo de serviço;
2. informa orçamento (faixa, teto ou "não sei"), prazo, título e descrição;
3. vê o Preço de referência (média dos fixos, faixa, n e posição do orçamento) e até 12 Prestadores compatíveis, com os motivos.

O Cliente logado publica o Projeto. O visitante entra ou se cadastra como Cliente sem perder o rascunho. O Cliente vê "Meus projetos" com os estados e pode cancelar um Projeto aberto.

**Blocked by:** 03

**Status:** ready-for-agent

- [x] Tabela projeto com checks; seed com mapeamento objetivo → tipos — drizzle/0003_projeto-triagem.sql; scripts/seed.ts (8 objetivos); constraints cobertas em tests/integration/triage.test.ts
- [x] Testes do Preço de referência (inclui n < 3) e da ordem dos compatíveis — tests/integration/triage.test.ts, tests/unit/triage.test.ts
- [x] Rascunho na URL validado no servidor; publicação exige Cliente — parseDraft na página e na action; Prestador/visitante recusados (integração e E2E)
- [x] Cancelamento só pelo dono e só ABERTO — UPDATE condicional; teste de outro Cliente/Prestador/ENCERRADO
- [x] Jornada no browser em mobile e desktop — E2E visitante→cadastro→publicar→Meus projetos; browser do Orca em 375 e 1440: sem overflow, console sem erros, rede sem 4xx/5xx

Ticket 07 do MVP 2 do Proposta.dev: Avaliações verificadas. A worktree nasce de `mvp2`, que já contém os tickets 02, 03, 04, 05, 06, 08 e 09 parte A.

Leia:
- docs/tasks/mvp2/issues/07-avaliacoes-verificadas.md;
- docs/tasks/mvp2/spec.md, seções "Avaliações" (histórias 51–55 e Implementation Decisions);
- docs/adr/0003-mvp2-contas-e-triagem.md;
- GLOSSARY.md (Avaliação verificada);
- AGENTS.md;
- DESIGN.md.

Também leia o código atual:
- src/modules/reviews;
- src/modules/proposals (Aceite);
- src/app/prestadores/[slug] (seção de avaliações e review-form);
- src/app/painel/projetos/[id] (estado pós-aceite);
- src/modules/triage (motivos dos compatíveis);
- os cartões de Proposta do ticket 06 (o ponto reservado para "verificadas").

TARGET:
- migration incremental 0005 com o trigger;
- src/modules/reviews (actions e queries);
- perfil público (seção de avaliações e cabeçalho de reputação);
- detalhe do Projeto ENCERRADO do Cliente (convite para avaliar);
- motivos dos Prestadores compatíveis na Triagem;
- cartões de Proposta;
- busca e comparação, onde mostram nota;
- testes.

CHANGE:
1. Regra de criação. Só pode criar uma Avaliação de um Prestador o usuário CLIENTE que tem Proposta ACEITA daquele Prestador em Projeto próprio. A regra vale em dois lugares:
   - no servidor, com requireCliente e a checagem a partir da sessão;
   - no banco, com um trigger BEFORE INSERT em avaliacao, na migration 0005, que recusa a inserção sem essa Proposta ACEITA.
   - Edição e exclusão continuam permitidas ao autor de qualquer Avaliação própria, inclusive as antigas. A unicidade usuário/prestador continua.
2. "Verificada" é derivada, sem coluna nova: existe Proposta ACEITA do autor com aquele Prestador.
   - Verificadas recebem o selo "Contratado pela Proposta.dev".
   - As do MVP 1 sem essa Proposta aparecem como "Avaliação anterior, sem contratação verificada", com tratamento visual mais discreto.
   - Não mostre o texto de "não verificada" nas verificadas.
3. Agregados por Prestador: média geral, total e número de verificadas, numa única query sem duplicar linhas por joins (use subconsulta ou EXISTS, e teste com um Prestador que tem duas Propostas ACEITAS do mesmo Cliente em Projetos diferentes). Mostre:
   - no Perfil público: "4,5/5 · 6 avaliações · 4 verificadas";
   - nos cartões de Proposta do ticket 06;
   - no motivo dos compatíveis na Triagem ("3 avaliações verificadas", história 24);
   - na busca e na comparação, onde hoje mostram a nota.
4. Projeto ENCERRADO do Cliente: um bloco "Avalie [Prestador]" com o formulário. Se a Avaliação já existe, mostre-a com os links de editar e excluir.
5. No Perfil público, o formulário de avaliação só aparece para um CLIENTE elegível. Os demais veem uma explicação curta:
   - visitante: "Entre como Cliente…";
   - Prestador: não avalia;
   - Cliente sem Aceite: "Só quem contratou este prestador por uma Proposta aceita pode avaliar".
   - A autoavaliação continua impossível.
6. Atualize o checklist do ticket 07 com a evidência. Se mudar uma regra, atualize o spec e o GLOSSARY no mesmo commit.

CONSTRAINTS:
- Migration incremental 0005, sem editar 0000–0004.
- O trigger precisa conviver com o seed demo (o ticket 09B vai semear Avaliações verificadas criando antes as Propostas ACEITAS) e com os testes existentes de avaliação. Ajuste os testes antigos que criavam Avaliação sem Aceite para criar o Aceite antes, ou para testar a recusa.
- Não confie em ids do formulário para autorizar.
- UI na identidade atual, AA, teclado, e 375 e 1440 sem overflow.
- Commits sem coautor de IA, em português com acentos, no estilo "feat: ...".

AMBIENTE:
- Copie C:\Users\Caio\Documents\dev\propostadev\.env para a raiz da worktree e troque DATABASE_URL para .../propostadev_w07 e DATABASE_URL_TEST para .../propostadev_w07_test.
- Crie as bases com `docker exec propostadev-db-1 createdb -U proposta propostadev_w07` e `docker exec propostadev-db-1 createdb -U proposta propostadev_w07_test`.
- Rode pnpm install, pnpm db:migrate, pnpm db:seed e `ALLOW_DEMO_SEED=true pnpm db:seed:demo`.
- Dev na porta 3007; E2E com E2E_PORT=3107. Rode `pnpm build` antes do test:e2e, porque ele usa `next start`.
- O container propostadev-db-1 é compartilhado; não o pare.
- O browser do Orca compartilha cookies entre worktrees. Para testar com login, use 127.0.0.1:3007 e espere que a sessão possa cair se outro agente estiver logando.

OBSERVABLE ACCEPTANCE:
- pnpm lint, typecheck, test, test:integration e E2E_PORT=3107 test:e2e passam.
- Testes de integração:
  - sem Aceite → recusa (action e trigger por SQL direto);
  - com Aceite → cria;
  - edição e exclusão só pelo autor;
  - agregados corretos sem duplicação;
  - flag de verificada correta para antigas e novas.
- E2E: Cliente com Projeto aceito avalia pelo detalhe do Projeto → o Perfil mostra o selo "Contratado pela Proposta.dev" e a contagem de verificadas.
- Verificação no browser em 375 e 1440 do Perfil público e do detalhe do Projeto ENCERRADO, com console e rede sem erros.

No worker_done, liste os commits, a migration e as decisões tomadas fora do spec.

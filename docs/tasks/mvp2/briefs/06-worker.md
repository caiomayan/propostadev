Ticket 06 do MVP 2 do Proposta.dev: Triagem de Propostas e Aceite, feitos pelo Cliente. A worktree nasce de `mvp2`, que já contém os tickets 02, 03, 04, 05 e 08.

Leia:
- docs/tasks/mvp2/issues/06-triagem-de-propostas-e-aceite.md;
- docs/tasks/mvp2/spec.md, seções "Triagem de propostas (Cliente)", "Domínio novo", "Transições" e "Visibilidade";
- docs/adr/0003-mvp2-contas-e-triagem.md;
- GLOSSARY.md (use os termos Proposta, Aceite, Preço de referência);
- AGENTS.md;
- DESIGN.md e docs/DESIGN-SYSTEM.md (identidade "régua de preço", com o componente PriceRuler).

Também leia o código existente antes de criar coisas novas:
- src/modules/proposals;
- src/modules/projects;
- src/modules/triage (query do Preço de referência);
- src/app/painel/projetos/[id];
- src/app/painel/propostas;
- src/components/provider-contacts*.

TARGET:
- src/modules/proposals: actions do Cliente e queries do Cliente;
- src/app/painel/projetos/[id]: a lista de Propostas, hoje em modo leitura, vira a tela de triagem;
- src/app/painel/propostas: depois do Aceite, mostra ao Prestador o contato do Cliente;
- testes de integração e E2E.

CHANGE:
1. Tela de triagem das Propostas, no detalhe do Projeto do Cliente.
   - Cada Proposta vira um cartão com:
     - nome e link para o Perfil público do Prestador;
     - valor, posicionado no PriceRuler contra o Preço de referência do tipo (sem referência, mostre só o valor e a faixa do orçamento do Cliente);
     - prazo comparado ao prazo desejado ("5 dias antes do desejado", "dentro do prazo", "10 dias além");
     - nota média e número de avaliações do Prestador (o ticket 07 vai acrescentar "verificadas", então deixe um ponto claro para isso);
     - mensagem, com o texto longo recolhido;
     - status.
   - Ordenação por valor, prazo ou reputação via searchParam `ordem` (padrão: pré-selecionadas primeiro, depois as mais recentes).
   - Filtro "só pré-selecionadas" via searchParam `pre=1`.
   - Use links e formulários, sem estado no cliente além do necessário.
2. Ações do Cliente, todas Server Actions com requireCliente e verificação de dono feita a partir da sessão:
   - pré-selecionar e desmarcar (ENVIADA ⇄ PRE_SELECIONADA);
   - recusar (ENVIADA ou PRE_SELECIONADA → RECUSADA, definitiva);
   - aceitar, com confirmação explícita no mesmo padrão do "Cancelar projeto", explicando que encerra o Projeto e recusa as demais.
   - Todas exigem Projeto ABERTO.
3. O Aceite é uma única transação:
   - um UPDATE condicional leva a Proposta a ACEITA apenas se ela está ENVIADA/PRE_SELECIONADA e o Projeto está ABERTO;
   - as demais ativas viram RECUSADA;
   - o Projeto vira ENCERRADO, com proposta_aceita_id preenchido;
   - o índice único parcial é a última barreira. Dois aceites concorrentes no mesmo Projeto resultam em exatamente um ACEITA, e o perdedor recebe uma mensagem amigável, não um 500.
4. Depois do Aceite:
   - o Cliente vê, no detalhe do Projeto, o Prestador escolhido em destaque, com os contatos públicos dele (reaproveite provider-contacts) e o link para o Perfil;
   - o Prestador, em "Minhas propostas", vê na Proposta ACEITA o nome completo e o e-mail do Cliente, com link mailto;
   - em nenhum outro caso o e-mail do Cliente aparece para um Prestador. Teste isso.
5. Projeto ENCERRADO ou CANCELADO: a lista fica somente leitura, sem botões de ação.
6. Atualize o checklist do ticket 06 com a evidência. Se mudar uma regra, atualize o spec e o GLOSSARY no mesmo commit.

CONSTRAINTS:
- Não confie em ids do formulário para autorizar; o dono sai da sessão.
- Dinheiro como decimal.
- Não crie migration, salvo se for indispensável; nesse caso, use a 0005 incremental.
- Não implemente avaliações (ticket 07).
- UI na identidade atual, AA, teclado e foco visível, e responsiva em 375 e 1440 sem overflow.
- Não edite src/components/site-header.tsx, src/app/painel/perfil|ofertas|conta, src/app/prestadores/**, src/app/comparar/** nem as páginas globais de erro/404/loading: outro worker está mexendo nelas.
- Commits sem coautor de IA, em português com acentos, no estilo "feat: ...".

AMBIENTE:
- Copie C:\Users\Caio\Documents\dev\propostadev\.env para a raiz da worktree e troque DATABASE_URL para .../propostadev_w06 e DATABASE_URL_TEST para .../propostadev_w06_test.
- Crie as bases com `docker exec propostadev-db-1 createdb -U proposta propostadev_w06` e `docker exec propostadev-db-1 createdb -U proposta propostadev_w06_test`.
- Depois rode pnpm install, pnpm db:migrate, pnpm db:seed e pnpm db:seed:demo.
- Dev na porta 3006; E2E com E2E_PORT=3106.
- Rode `pnpm build` antes do test:e2e, porque o E2E usa `next start` sobre o build existente.
- O container propostadev-db-1 é compartilhado; não o pare.

OBSERVABLE ACCEPTANCE:
- pnpm lint, typecheck, test, test:integration e E2E_PORT=3106 test:e2e passam.
- Testes de integração:
  - aceite concorrente (Promise.all de dois aceites no mesmo Projeto) → exatamente um ACEITA, Projeto ENCERRADO e as demais RECUSADA;
  - transições recusadas com Projeto não ABERTO, com quem não é dono, para Prestador e para recusa → pré-seleção;
  - e-mail do Cliente visível só para o Prestador da Proposta ACEITA.
- E2E: Cliente publica → Prestador propõe → Cliente pré-seleciona, filtra, aceita com confirmação → Cliente vê os contatos do Prestador → Prestador vê o e-mail do Cliente.
- Verificação no browser embutido do Orca (skill orca-cli) em 375 e 1440 da tela de triagem das Propostas e do estado pós-aceite, com console e rede sem erros.

No worker_done, liste os commits e as decisões tomadas fora do spec.

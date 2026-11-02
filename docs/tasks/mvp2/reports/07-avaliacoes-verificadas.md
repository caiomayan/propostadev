# Relatório do worker: ticket 07 (Avaliações verificadas)

Branch `caiomayan/mvp2-07-avaliacoes` (a partir de `mvp2`), commitada e **não publicada**.

## Entrega
- Migration `drizzle/0005_avaliacao-verificada.sql`: trigger `avaliacao_requer_aceite` (BEFORE INSERT) recusa Avaliação sem Proposta ACEITA do autor com o Prestador (23514, mensagem própria). Nome > `avaliacao_no_self_review`, então a autoavaliação mantém a mensagem dela. Constante do nome em `src/modules/reviews/rules.ts`.
- `src/modules/reviews`: `canCreateReview`, `getOwnReview`, `reviewIsVerified` (EXISTS) e `reputationSubquery` (média, total e verificadas por Prestador, sem JOIN em proposta). Usados na busca/comparação, Perfil, compatíveis da Triagem e cartões de Proposta.
- `saveReview`: quem já tem Avaliação só a atualiza (UPDATE, sem Aceite); quem não tem precisa ser CLIENTE com Aceite (checagem no servidor + trigger).
- Perfil: selo "Contratado pela Proposta.dev" nas verificadas; "Avaliação anterior, sem contratação verificada" (tracejado, discreto) nas antigas; formulário só para Cliente elegível ou autor de Avaliação; explicações para visitante, Prestador, dono do perfil e Cliente sem Aceite.
- Projeto ENCERRADO: bloco "Avalie [Prestador]" com o formulário; com Avaliação existente, mostra-a com Editar e Excluir (details).
- `scripts/seed-demo.ts`: a Avaliação fictícia antiga (cliente1 → prestador-demo-1) é inserida com o trigger desativado só naquele INSERT, na mesma transação.

## Verificação
lint e typecheck limpos; unit 62; integração 67 (novo tests/integration/reviews.test.ts); `pnpm build` e `E2E_PORT=3107 test:e2e` com 23 passando (acceptance.spec.ts cobre o fluxo Projeto → avaliar → Perfil com selo e "1 verificada"). Browser do Orca em 375 e 1440: Perfil (com avaliação verificada e com a anterior) e Projeto ENCERRADO (convite e avaliação feita); `scrollWidth` sem overflow, console sem erros, rede sem status ≥ 400 do app (só o `/__nextjs_font/geist-latin.woff2` 403 do overlay do `next dev`). Só o tema escuro foi visto.

## Decisões fora do spec
1. Ações usam `getSession` + `accountTypeDenial` em vez de `requireCliente` (mesma decisão do ticket 06: devolvem `{ error }` e funcionam com o mock dos testes).
2. Editar/excluir vale para o autor de qualquer Avaliação própria, inclusive conta PRESTADOR com Avaliação herdada do MVP 1; só criar exige CLIENTE + Aceite. Spec e GLOSSARY atualizados.
3. `saveReview` deixou de ser upsert: o BEFORE INSERT dispararia antes do ON CONFLICT e recusaria a edição das antigas.
4. Com zero verificadas a linha diz "nenhuma verificada" (em vez de omitir). Nos compatíveis da Triagem a linha de reputação fica sem a contagem, porque o motivo "N avaliações verificadas" já a mostra.
5. Prestador com perfil desativado: o bloco do Projeto mostra aviso em vez do formulário (a action recusa perfil inativo, como antes).
6. Texto do dono do perfil mudou para "Você pode acompanhar as avaliações do seu perfil aqui. Não é possível avaliar o próprio perfil."; o E2E "perfil próprio" perdeu a parte de formulário adulterado (não há mais formulário para Prestador; a recusa está nos testes de integração/unit).
7. Testes antigos que criavam Avaliação sem Aceite agora criam o Aceite antes (`tests/integration/support.ts: grantAcceptance`).
8. `docs/PRD.md` (MVP 1, histórico) ainda diz que avaliações não comprovam contratação; não alterado.

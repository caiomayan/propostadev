# MVP 2: estado em 02/11/2026 (pausa ao meio-dia)

## Integrado em `mvp2` (verde: lint, typecheck, unitários 59, integração 46, build, E2E 22)
- 01, 02, 03, 04, 05, 08: **done**.
- 09 parte A (acabamento visual): **done**.
- A pendência dos "espaços faltando" ("3prestadores") era um artefato da árvore de acessibilidade do browser de teste. O texto real tem os espaços.

## Em andamento
- **06 Triagem de Propostas e Aceite**: **entregue** no branch `caiomayan/mvp2-06-aceite` (c35dc69, publicado), ainda NÃO integrado. O worker relata lint, typecheck, unitários 62, integração 58 e E2E 23 verdes, e browser em 375 e 1440 limpo.
  - Falta: merge em mvp2 + bateria completa (`pnpm build` antes do E2E).
  - Falta decidir a pendência registrada no relatório do ticket 06: contatos de Perfil desativado depois do Aceite.

## Próximos
- 07: o brief está pronto em `docs/tasks/mvp2/briefs/07-worker.md`. Despache-o depois do merge do 06.

07 Avaliações verificadas → 09 parte B (seed demo com Propostas e acabamento das telas novas; os achados estão no ticket 09) → 10 Entrega final.

## Aprendizados de ambiente
- O E2E usa `next start` sobre o build existente. Rode `pnpm build` antes de `pnpm test:e2e`, senão ele testa código antigo.
- O browser do Orca tem um único pote de cookies para todas as worktrees. Com workers testando logins em paralelo, a sessão do coordenador cai. Para verificar telas logadas em paralelo, use um Playwright isolado.
- O seed demo local exige `ALLOW_DEMO_SEED=true`.

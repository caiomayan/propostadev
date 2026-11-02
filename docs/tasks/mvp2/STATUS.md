# MVP 2: estado em 02/11/2026 (tarde)

## Integrado em `mvp2` (verde: lint, typecheck, unitários 62, integração 58, build, E2E 23)
- 01, 02, 03, 04, 05, 06, 08: **done**.
- 09 parte A: **done**.
- 09 parte B: seed demo concluído (`scripts/demo-scenarios.ts`), textos alinhados ao fluxo de Propostas, navegação do painel no celular e detalhe da Oportunidade em duas colunas.
  - Falta: revisão final das telas do 07 depois do merge.

## Em andamento
- **07 Avaliações verificadas**: worker do Orca na worktree `mvp2-07-avaliacoes`, com o brief em `briefs/07-worker.md`.

## Próximo: 10 Entrega final
1. Merge do 07 e bateria completa.
2. Auditoria de entrega (spec × código × tickets).
3. Merge `mvp2` → `main`. O build de produção aplica as migrations 0002–0005 e o seed do catálogo.
4. Seed demo na produção, rodado localmente contra o Supabase com DEMO_PASSWORD forte (fora do repositório).
5. `DEMO_MODE=true` já está na Vercel (production e preview).
6. Smoke test em produção e roteiro da apresentação (`docs/tasks/mvp2/ROTEIRO.md`).

## Aprendizados de ambiente
- O E2E usa `next start` sobre o build existente. Rode `pnpm build` antes de `pnpm test:e2e`.
- O browser do Orca tem um único pote de cookies para todas as worktrees. Para verificar telas logadas com workers em paralelo, use um Playwright isolado.
- O seed demo local exige `ALLOW_DEMO_SEED=true`.
- Falha intermitente vista uma vez: `auth.spec.ts:150` (query string longa). Passou isolado duas vezes e na bateria seguinte.

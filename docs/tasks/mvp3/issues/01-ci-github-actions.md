# 01: CI no GitHub Actions

**What to build:** cada PR para a main roda lint, tipos, testes unitários, de integração, e2e e o build num runner Linux, com Postgres de serviço. Rascunhos e PRs só de documentação pulam os jobs por dentro (if no job), nunca por filtro no nível do workflow. Spec: docs/tasks/mvp3/spec.md ("CI").

**Blocked by:** None (can start immediately)

**Status:** done

- [ ] Workflow em `pull_request` para main (opened, synchronize, reopened, ready_for_review), sem gatilho em push.
- [ ] Todo job com `if: github.event.pull_request.draft == false`, `timeout-minutes` e cache do pnpm; `concurrency` com cancel-in-progress.
- [ ] Integração e e2e usam `DATABASE_URL_TEST` num serviço Postgres 17; e2e instala só o Chromium e roda sobre `pnpm build`.
- [ ] Segredos de teste são valores descartáveis gerados no próprio job; nenhum segredo real.
- [ ] Evidência: run verde no PR do MVP 3.

## Comentários

- 25/11: PR #1; CI verde em todos os PRs do MVP 3 (#2 a #8), com integração, build e e2e.

# 04: Correções da retro (log da migration e checagem de disponibilidade)

**What to build:** `scripts/migrate.ts` passa a mostrar o código e a mensagem do erro do driver, sem a connection string. Workflow agendado `.github/workflows/disponibilidade.yml` que testa `/` e `/buscar` de produção a cada 30 minutos e falha se não vier 200. Spec: histórias 17–18.

**Blocked by:** None

**Status:** in-progress (coordenador; falta rodar o workflow depois do merge)

- [x] Migration com senha errada mostra `28P01` no log, sem a URL. Evidência: `DATABASE_URL=<senha errada> tsx scripts/migrate.ts` → "Não foi possível aplicar migrations: Failed query: CREATE SCHEMA IF NOT EXISTS \"drizzle\" ← 28P01 password authentication failed for user \"proposta\""; tests/unit/db-error.test.ts (3 testes).
- [ ] Workflow roda manualmente (`workflow_dispatch`) e passa.

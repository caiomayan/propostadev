# 04: Correções da retro (log da migration e checagem de disponibilidade)

**What to build:** `scripts/migrate.ts` passa a mostrar o código e a mensagem do erro do driver, sem a connection string. Workflow agendado `.github/workflows/disponibilidade.yml` que testa `/` e `/buscar` de produção a cada 30 minutos e falha se não vier 200. Spec: histórias 17–18.

**Blocked by:** None

**Status:** ready-for-agent (coordenador)

- [ ] Migration com senha errada mostra `28P01` no log, sem a URL.
- [ ] Workflow roda manualmente (`workflow_dispatch`) e passa.

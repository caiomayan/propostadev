# 03: Filtros de Oportunidades

**What to build:** em /painel/oportunidades, o Prestador filtra por texto (título e descrição), Tipo de serviço (só os seus), orçamento a partir de R$ X (Projetos com orçamento "não sei" continuam e aparecem marcados), prazo desejado de até N dias e situação (convidado, sem Proposta minha, já enviei). Filtros combinam com a ordenação existente, ficam na URL, mostram a contagem e têm "limpar filtros". Sem migration; a Triagem do Cliente não muda. Spec: docs/tasks/mvp3/spec.md (histórias 10–21). ADR 0004, decisão 5.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Prefactor feito pelo coordenador no mvp3: migration 0007 (coluna `vip`, tabelas `interesse_vip` e `preco_mercado_externo`, RLS) e módulo de seed próprio em `scripts/demo-mvp3/oportunidades.ts` (idempotente, só aditivo, pode rodar contra a produção). Não crie migration nova; não edite `scripts/seed-demo.ts`.
- [x] Integração (evidência: `pnpm test:integration` → 78 passed, incl. tests/integration/opportunity-filters.test.ts, 10 testes): cada filtro isolado e combinados; NAO_SEI incluído com filtro de orçamento; Projeto sem prazo só aparece sem filtro de prazo; Tipo fora dos do Prestador ignorado; situação usa só o Prestador da sessão; entradas inválidas ignoradas sem erro.
- [x] Parâmetros validados (src/modules/proposals/filters.ts, campo a campo; Prestador vem de `getProviderStanding(session)`): com zod no servidor; Prestador sempre da sessão.
- [x] Estado vazio e contagem (verificado no browser e no e2e): com "limpar filtros"; contagem de resultados.
- [x] Seed demo (scripts/demo-mvp3/oportunidades.ts; rodado 2x, 0 duplicados): (no seu módulo): Oportunidades variadas (orçamentos, prazos, Convites) para mostrar os filtros.
- [x] E2E (tests/e2e/opportunity-filters.spec.ts; 6 passed contra `next dev` com a demo; no CI roda com o build): abrir a página com filtros na URL e ver o recorte certo.
- [x] Verificado no browser (Chromium headless, 375 e 1440 px: sem overflow horizontal, sem erro de console/rede): em 375 e 1440 px, sem erro de console.

## Comentários

- Decisão não coberta pela spec: situação `enviada`/`sem_proposta` considera qualquer Proposta do Prestador no Projeto (inclusive retirada/recusada), coerente com o chip de status do card. Coordenador pode redefinir.
- Seletor de Tipo só aparece se o Prestador tem Ofertas em 2+ Tipos. Vírgula decimal aceita em `orcamento_min`.
- `pnpm lint`, tipos e `pnpm test` (97) passando. Build e e2e completo ficam para o CI.

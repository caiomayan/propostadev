# 03: Filtros de Oportunidades

**What to build:** em /painel/oportunidades, o Prestador filtra por texto (título e descrição), Tipo de serviço (só os seus), orçamento a partir de R$ X (Projetos com orçamento "não sei" continuam e aparecem marcados), prazo desejado de até N dias e situação (convidado, sem Proposta minha, já enviei). Filtros combinam com a ordenação existente, ficam na URL, mostram a contagem e têm "limpar filtros". Sem migration; a Triagem do Cliente não muda. Spec: docs/tasks/mvp3/spec.md (histórias 10–21). ADR 0004, decisão 5.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Prefactor feito pelo coordenador no mvp3: migration 0007 (coluna `vip`, tabelas `interesse_vip` e `preco_mercado_externo`, RLS) e módulo de seed próprio em `scripts/demo-mvp3/oportunidades.ts` (idempotente, só aditivo, pode rodar contra a produção). Não crie migration nova; não edite `scripts/seed-demo.ts`.
- [ ] Integração: cada filtro isolado e combinados; NAO_SEI incluído com filtro de orçamento; Projeto sem prazo só aparece sem filtro de prazo; Tipo fora dos do Prestador ignorado; situação usa só o Prestador da sessão; entradas inválidas ignoradas sem erro.
- [ ] Parâmetros validados com zod no servidor; Prestador sempre da sessão.
- [ ] Estado vazio com "limpar filtros"; contagem de resultados.
- [ ] Seed demo (no seu módulo): Oportunidades variadas (orçamentos, prazos, Convites) para mostrar os filtros.
- [ ] E2E: abrir a página com filtros na URL e ver o recorte certo.
- [ ] Verificado no browser em 375 e 1440 px, sem erro de console.

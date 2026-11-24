# 06: Demo de produção e entrega

**What to build:** o MVP 3 em produção, com a demo pronta para a Review de 25/11 às 12h30: Prestadores com selo, Prestadores VIP, Oportunidades variadas para os filtros e a primeira coleta real de preços externos feita. README e STATUS atualizados. Spec: docs/tasks/mvp3/spec.md (histórias 42–43).

**Blocked by:** 01, 02, 03, 04, 05

**Status:** ready-for-agent

- [ ] Cada feature foi para a main no seu próprio PR (CI verde e code review), uma por vez, assim que ficou pronta.
- [ ] Dono gravou `FIRECRAWL_API_KEY` e `CRON_SECRET` na Vercel (Production).
- [ ] Merge na main (autorizado pelo dono para 24–25/11); deploy de produção confirmado pelo MCP da Vercel; migrations aplicadas.
- [ ] Módulos de `scripts/demo-mvp3/` (selo, oportunidades, vip) rodados contra a produção, só aditivos, sem `DEMO_RESET` e sem preços externos fictícios; contagem de Prestadores com selo em produção registrada; primeira coleta real executada; fontes que falharem registradas.
- [ ] Smoke test em produção: selo no Perfil, filtros de Oportunidades, Destaque VIP e interesse, preço externo na Triagem; sem erro de console.
- [ ] docs/tasks/mvp3/STATUS.md e README atualizados; roteiro curto para a apresentação.

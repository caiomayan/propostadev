# 04: Prestador VIP

**What to build:** Prestadores marcados como VIP pela plataforma (coluna `vip`, só seed/SQL) mostram o selo VIP no Perfil e nos cards da busca. A primeira página da busca ganha a faixa "Destaque VIP" com até três Prestadores VIP que atendem aos filtros aplicados (ordem: nota, depois nome); sem VIP compatível, a faixa some. A Triagem e os compatíveis não mudam. O painel do Prestador ganha a página do VIP com os benefícios, o aviso "Nesta versão não há assinatura nem cobrança" e o botão "Tenho interesse", que registra o Interesse no VIP uma única vez. Spec: docs/tasks/mvp3/spec.md (histórias 22–31). ADR 0004, decisões 3 e 4.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Prefactor feito pelo coordenador no mvp3: migration 0007 (coluna `vip`, tabelas `interesse_vip` e `preco_mercado_externo`, RLS) e módulo de seed próprio em `scripts/demo-mvp3/vip.ts` (idempotente, só aditivo, pode rodar contra a produção). Não crie migration nova; não edite `scripts/seed-demo.ts`.
- [ ] Integração: Destaque respeita filtros e limite de 3; nenhuma ação escreve `vip`; Interesse idempotente; Cliente e Prestador sem e-mail confirmado recusados; rate limit de mutações aplicado.
- [ ] Triagem e compatíveis não usam `vip` para ordenar (teste).
- [ ] Seed demo (no seu módulo): 3 a 4 Prestadores VIP em Tipos diferentes.
- [ ] E2E: faixa Destaque VIP na busca e registro de interesse pelo painel.
- [ ] Verificado no browser em 375 e 1440 px, sem erro de console.

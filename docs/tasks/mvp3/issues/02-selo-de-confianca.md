# 02: Selo de confiança

**What to build:** o Prestador com e-mail confirmado, ao menos uma Avaliação verificada e média das verificadas ≥ 4,0 mostra o Selo de confiança no Perfil, nos cards da busca e nos Prestadores compatíveis (Triagem e Projeto), com um "por quê" que lista os critérios. No painel, o Prestador vê o checklist dos três critérios. Tudo derivado, sem coluna. Spec: docs/tasks/mvp3/spec.md (histórias 1–9). ADR 0004, decisão 2.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Prefactor feito pelo coordenador no mvp3: migration 0007 (coluna `vip`, tabelas `interesse_vip` e `preco_mercado_externo`, RLS) e módulo de seed próprio em `scripts/demo-mvp3/selo.ts` (idempotente, só aditivo, pode rodar contra a produção). Não crie migration nova; não edite `scripts/seed-demo.ts`.
- [x] Integração: sem verificada → sem selo; verificada nota ≥ 4 + e-mail confirmado → selo; e-mail não confirmado → sem; média verificada < 4,0 → sem; só Avaliações antigas → sem; agregados sem duplicação por joins.
- [x] Selo calculado na mesma consulta que agrega reputação (sem consulta por linha), média comparada em decimal no banco.
- [x] Componente único de selo com "por quê" acessível por teclado e leitor de tela.
- [x] Checklist dos critérios no painel do Prestador.
- [x] Seed demo (no seu módulo): pelo menos 5 Prestadores com selo e alguns sem, para a apresentação.
- [ ] E2E: selo visível no Perfil de um Prestador do seed.
- [x] Verificado no browser em 375 e 1440 px, sem erro de console.

## Evidência (worker, 25/11/2026)
- Integração: `pnpm test:integration tests/integration/trust-seal.test.ts` → 5 passed (busca, Perfil, compatíveis, média decimal 4.5/3.5/4.0, checklist); suíte completa de integração 73 passed; `pnpm test` 97 passed; lint e tipos limpos.
- Selo vem de `reputationSubquery` (mesma agregação; EXISTS, sem join; `avg(...) >= 4.0` em numeric no banco). `getTrustCriteria` alimenta o checklist.
- Componente: `src/components/trust-seal.tsx` (`<details>`, teclado nativo) e `trust-checklist.tsx`.
- Seed: demo local com 15 Prestadores com selo e 5 sem (`scripts/demo-mvp3/selo.ts` só garante e-mail confirmado nos demo com verificada e imprime a contagem).
- Browser: 375 e 1440 px (Perfil, busca, painel) sem overflow e sem erro de console do selo (só o aviso preexistente de `scroll-behavior` do Next).
- E2E `tests/e2e/trust-seal.spec.ts` escrito (Perfil, busca, ausência de selo, checklist); não executado localmente (regra do brief: roda no CI), por isso o item fica aberto até o CI.

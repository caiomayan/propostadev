# 05: Preço de mercado externo (Firecrawl)

**What to build:** uma coleta semanal com Firecrawl lê as fontes públicas versionadas no código e grava, por Tipo de serviço e por fonte, a faixa em reais, o trecho que a sustenta e a data. O resultado da Triagem e o painel de Ofertas mostram, ao lado do Preço de referência e sem misturar, uma linha por fonte com faixa, nome, link e data, ou a mensagem de que não há preço externo. A coleta roda pelo Cron da Vercel (rota protegida por `CRON_SECRET`) e por um script manual. Spec: docs/tasks/mvp3/spec.md (histórias 32–41). ADR 0004, decisão 1.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Prefactor feito pelo coordenador no mvp3: migration 0007 (coluna `vip`, tabelas `interesse_vip` e `preco_mercado_externo`, RLS) e módulo de seed próprio em `scripts/demo-mvp3/precos-externos.ts` (idempotente, só aditivo, pode rodar contra a produção). Não crie migration nova; não edite `scripts/seed-demo.ts`.
- [x] Fontes versionadas por slug (pesquisa de 24/11 na spec): Cronoshare, Hostinger, Nuvemshop e Sebrae PR; api, backend e integracao-de-sistemas sem fonte. — Evidência: src/modules/external-prices/sources.ts (8 fontes, 5 slugs; api, backend e integração sem fonte).
- [x] Coletor server-only com cliente Firecrawl atrás de interface (API HTTP v2, formato JSON com schema `{ valor_min, valor_max, trecho }`); fontes em paralelo, falha isolada por fonte. — Evidência: client.ts (interface PriceExtractor + cliente HTTP v2) e collector.ts (Promise.all, falha isolada). Cliente real testado com 1 scrape (Cronoshare): 800–2000.
- [x] Integração com cliente falso: grava válidos, descarta inválidos (não numérico, zero, mínimo > máximo), mantém o último valor quando a fonte falha; exibição devolve a última linha válida por fonte; a rota do cron recusa sem o segredo. — Evidência: `pnpm test:integration tests/integration/external-prices.test.ts`: 5 testes passam (válidos, inválidos, última válida mantida, Tipo inexistente, cron recusa sem segredo).
- [x] Preço externo nunca entra no Preço de referência (teste). — Evidência: teste 'preço externo nunca entra no Preço de referência' (mesmo arquivo).
- [x] `vercel.json` com cron semanal (segunda, 09:00 UTC) e script de pacote para coleta manual. — Evidência: vercel.json (0 9 * * 1) e `pnpm precos:coletar` (scripts/coletar-precos-externos.ts).
- [x] `.env.example` com `FIRECRAWL_API_KEY` e `CRON_SECRET` vazios; README explica. — Evidência: .env.example e seção 'Preço de mercado externo' no README.
- [x] Seed demo (no seu módulo) grava preços externos de exemplo só em banco local (o gancho já é condicionado), com fonte claramente fictícia ("Fonte de demonstração", URL https://example.com/...); nenhum teste chama o Firecrawl real. — Evidência: scripts/demo-mvp3/precos-externos.ts (idempotente, example.com); nenhum teste chama o Firecrawl real.
- [x] Antes de montar o coletor, confira o formato real da API v2 do Firecrawl (scrape com formato json) na documentação oficial (docs.firecrawl.dev, leitura grátis) e o limite de duração de função do plano Hobby da Vercel; defina `maxDuration` na rota do cron. — Evidência: API v2 conferida (notas do coordenador + teste real); Hobby: 300 s, `maxDuration = 300` na rota.
- [x] E2E: preço externo no resultado da Triagem. — Evidência: tests/e2e/external-prices.spec.ts (escrito; roda no CI).
- [x] Verificado no browser em 375 e 1440 px, sem erro de console. — Evidência: Playwright/Chromium local: Triagem e /painel/ofertas em 375 e 1440 px, sem erro de console nem scroll horizontal.

## Comentários

- 25/11, primeira coleta real em produção: a Hostinger devolveu "R$ 1.000" como 1,0 e a seção errada da página para e-commerce. Correção no PR #6: prompt com formato brasileiro explícito e trava que exige os dois valores no trecho citado. Por decisão do dono (Q15), e-commerce ficou sem fonte: a única página achada trazia custo mensal de operação ("R$ 5.000 a mais de R$ 50.000 mensais"), não de desenvolvimento. Ficam 7 fontes em 4 Tipos de serviço.

# 05: Preço de mercado externo (Firecrawl)

**What to build:** uma coleta semanal com Firecrawl lê as fontes públicas versionadas no código e grava, por Tipo de serviço e por fonte, a faixa em reais, o trecho que a sustenta e a data. O resultado da Triagem e o painel de Ofertas mostram, ao lado do Preço de referência e sem misturar, uma linha por fonte com faixa, nome, link e data, ou a mensagem de que não há preço externo. A coleta roda pelo Cron da Vercel (rota protegida por `CRON_SECRET`) e por um script manual. Spec: docs/tasks/mvp3/spec.md (histórias 32–41). ADR 0004, decisão 1.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Prefactor feito pelo coordenador no mvp3: migration 0007 (coluna `vip`, tabelas `interesse_vip` e `preco_mercado_externo`, RLS) e módulo de seed próprio em `scripts/demo-mvp3/precos-externos.ts` (idempotente, só aditivo, pode rodar contra a produção). Não crie migration nova; não edite `scripts/seed-demo.ts`.
- [ ] Fontes versionadas por slug (pesquisa de 24/11 na spec): Cronoshare, Hostinger, Nuvemshop e Sebrae PR; api, backend e integracao-de-sistemas sem fonte.
- [ ] Coletor server-only com cliente Firecrawl atrás de interface (API HTTP v2, formato JSON com schema `{ valor_min, valor_max, trecho }`); fontes em paralelo, falha isolada por fonte.
- [ ] Integração com cliente falso: grava válidos, descarta inválidos (não numérico, zero, mínimo > máximo), mantém o último valor quando a fonte falha; exibição devolve a última linha válida por fonte; a rota do cron recusa sem o segredo.
- [ ] Preço externo nunca entra no Preço de referência (teste).
- [ ] `vercel.json` com cron semanal (segunda, 09:00 UTC) e script de pacote para coleta manual.
- [ ] `.env.example` com `FIRECRAWL_API_KEY` e `CRON_SECRET` vazios; README explica.
- [ ] Seed demo (no seu módulo) grava preços externos de exemplo só em banco local (o gancho já é condicionado), com fonte claramente fictícia ("Fonte de demonstração", URL https://example.com/...); nenhum teste chama o Firecrawl real.
- [ ] Antes de montar o coletor, confira o formato real da API v2 do Firecrawl (scrape com formato json) na documentação oficial (docs.firecrawl.dev, leitura grátis) e o limite de duração de função do plano Hobby da Vercel; defina `maxDuration` na rota do cron.
- [ ] E2E: preço externo no resultado da Triagem.
- [ ] Verificado no browser em 375 e 1440 px, sem erro de console.

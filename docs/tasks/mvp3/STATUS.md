# MVP 3: entregue em produção (25/11/2026)

https://propostadev-one.vercel.app roda a `main` com os 4 itens do card "MVP 3° versão" do Trello. Spec: `spec.md`; decisões: `docs/adr/0004-mvp3.md`.

| Item | Ticket | PR | Estado |
|---|---|---|---|
| CI no GitHub Actions | 01 | #1 | em produção |
| Selo de confiança | 02 | #2 | em produção |
| Filtros de Oportunidades | 03 | #3 | em produção |
| Preço de mercado externo (Firecrawl) | 05 | #4, #6 | em produção; coleta semanal (segunda, 09:00 UTC) |
| Prestador VIP | 04 | #5, #8 | em produção |
| Next 16.4.5 (segurança) | — | #7 | em produção |

## Produção
- Migration 0007 aplicada pelo build (coluna `vip`, tabelas `interesse_vip` e `preco_mercado_externo`, RLS).
- Dados de demo do MVP 3 rodados contra a produção, só aditivos e só em contas `@demo.example`: 15 Prestadores com Selo de confiança, 4 VIP (demo 2, 3, 5 e 8), 18 Oportunidades abertas, com Convites para o prestador1.
- Primeira coleta real de preços externos em 24/11 (21h44, horário de Brasília). Fontes com preço: landing page (Cronoshare), site institucional (Cronoshare, Hostinger, Nuvemshop), sistema web (Hostinger), manutenção (Hostinger, valor mensal). Sem fonte: e-commerce (decisão do dono, Q15: a única página trazia custo mensal de operação), api, backend e integração.
- Segredos na Vercel (Production): `FIRECRAWL_API_KEY`, `CRON_SECRET` e `DATABASE_URL`. Cópia na VM em `~/.config/propostadev/producao.env` (fora do git, modo 600).

## Pendências
- `DATABASE_URL` de **Preview** ficou sem valor depois da troca da senha do banco em 24/11: previews de PR não acessam o banco. Os previews usam o banco de produção (README), então decidir se voltam a ter acesso ou não.
- Telas logadas (filtros de Oportunidades, página do VIP) foram verificadas localmente e no e2e do CI; em produção, só as telas públicas foram abertas no navegador.
- Rollback: redeploy de um deploy anterior na Vercel (Deployments → Promote). A migration 0007 é aditiva e pode ficar.

## Aprendizados de ambiente
- Previews e produção compartilham o banco e as migrations só rodam no build de produção: verificar features com schema novo localmente e no CI, nunca no preview.
- A senha do banco do Supabase foi trocada no meio da noite e derrubou a produção (erro 500 em toda página com banco) e o build. Ao trocar a senha, atualizar a `DATABASE_URL` na Vercel no mesmo momento; o script `propostadev-briefs/senha-banco.sh` da VM testa a conexão antes de gravar.
- Na extração com LLM, "R$ 1.000" virou 1,0. A coleta agora exige que os dois valores apareçam no trecho citado.
- A faixa Destaque VIP repete cards na página 1 da busca: testes da busca precisam mirar `.search-results`.

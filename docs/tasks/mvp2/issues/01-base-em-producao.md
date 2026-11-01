# 01: Base atual em produção na Vercel + Supabase

**What to build:** o MVP 1 atual roda em https://propostadev-one.vercel.app a partir do GitHub (branch main). O banco Supabase é inspecionado, as migrations são aplicadas pelo fluxo versionado e a conexão do app fica configurada para o pooler com SSL. Daqui em diante, todo merge em main publica sozinho.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Banco Supabase inspecionado antes de qualquer alteração (tabelas, dados, extensões), com o estado registrado aqui
- [ ] Conexão do app compatível com o pooler (prepared statements desativados quando necessário) e com SSL
- [ ] `unaccent` e triggers de 0001 funcionando no Supabase
- [ ] Script de migração de produção documentado no README (conexão de sessão/direta)
- [ ] Deploy de produção pronto e páginas públicas sem erro no console/rede

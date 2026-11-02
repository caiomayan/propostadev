# 01: Base atual em produção na Vercel + Supabase

**What to build:** o MVP 1 atual roda em https://propostadev-one.vercel.app a partir do GitHub (branch main). O banco Supabase é inspecionado, as migrations são aplicadas pelo fluxo versionado e a conexão do app fica configurada para o pooler com SSL. Daqui em diante, todo merge em main publica sozinho.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Banco Supabase inspecionado antes de qualquer alteração (tabelas, dados, extensões), com o estado registrado aqui
- [x] Conexão do app compatível com o pooler (prepared statements desativados quando necessário) e com SSL
- [x] `unaccent` e triggers de 0001 funcionando no Supabase
- [x] Script de migração de produção documentado no README (conexão de sessão/direta)
- [x] Deploy de produção pronto e páginas públicas sem erro no console/rede

## Comentários

**01/11/2026 — inspeção do Supabase (projeto jhfkprlsfruzsatgjati, sa-east-1, Postgres 17)**
- O projeto estava pausado pelo plano gratuito, sem atividade. Foi reativado via MCP, e o site em produção ficou fora do ar até lá.
- O schema é deste repo: `drizzle.__drizzle_migrations` tem 0000 e 0001 aplicadas. Tabelas: auth (user, session, account, verification, rate_limit) + domínio (categoria, tipo_servico, perfil_prestador, oferta_servico, avaliacao, mutation_rate_limit).
- Dados: 5 usuários, 3 perfis, 3 ofertas, 0 avaliações e 8 tipos. São dados de teste da equipe, preservados; o backfill do tipo de conta (ticket 03) vai classificá-los.
- `unaccent` está em `public`. RLS ligado sem políticas em todas as tabelas, o que bloqueia a API REST pública do Supabase; o app conecta direto como dono e não é afetado.
- Vercel: projeto já conectado ao GitHub `caiomayan/propostadev`, com produção servindo da branch main. Env de produção: DATABASE_URL, BETTER_AUTH_SECRET e BETTER_AUTH_URL, todos *sensitive* (não legíveis pelo CLI).
- Smoke: `/`, `/buscar` e `/entrar` responderam 200 depois da reativação.
- Pendente: connection string do dono no `.env.local` (SUPABASE_DATABASE_URL) para rodar migrations e seed em produção.

**01/11/2026 — acesso para migrations**
- SUPABASE_DATABASE_URL (Session pooler, aws-1-sa-east-1, porta 5432) configurado pelo dono em `.env.local`, fora do git. Conexão com SSL testada: `current_user=postgres`, 2 migrations registradas.
- Próximo passo, antes do deploy do MVP 2: script de migração de produção que use essa URL com SSL, documentado no README.

**01/11/2026 — produção restabelecida e corrigida**
- Causa do 500: a senha do banco foi redefinida e o DATABASE_URL da Vercel continuava com a antiga (`28P01 password authentication failed`).
- O DATABASE_URL foi atualizado pelo dono via `vercel env update`, no mesmo formato documentado (transaction pooler 6543, `sslmode=verify-full&sslrootcert=supabase-ca.crt`). A URL foi testada antes com verificação TLS pela CA oficial.
- Hotfix de segurança: Next 16.4.0 → 16.4.3 (GHSA-2464-fhr4-w9xw e RCE em `use cache`) e Zod 4.6.5 → 4.6.6. lint, typecheck, unit 28, integração 9, build e E2E 8 passaram; publicado na main.
- O build command da Vercel passou a rodar migrations e seed só com VERCEL_ENV=production (README atualizado).
- Redeploy de produção concluído. `/`, `/buscar`, `/entrar` e `/cadastro` respondem 200; console sem erros no browser do Orca.
- Pendência para a entrega: as migrations do MVP 2 entram em produção pelo build da main no merge final (ticket 10).

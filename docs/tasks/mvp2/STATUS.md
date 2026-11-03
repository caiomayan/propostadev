# MVP 2: entregue em produção (02/11/2026)

https://propostadev-one.vercel.app roda a `main` (merge 0dace58 do `mvp2`). Tickets 01 a 10 estão **done**.

## Produção
- Migrations 0000–0006 aplicadas pelo build da Vercel.
- Seed demo rodado localmente contra o Supabase: 20 Prestadores em todos os tipos de serviço, 3 Clientes, 9 Projetos, 19 Propostas e 5 Avaliações (4 verificadas).
- A senha das contas demo está no `.env.local` do coordenador (`DEMO_PASSWORD_PROD`), fora do repositório.
- Smoke test de escrita feito em produção. A demo foi restaurada em seguida com `DEMO_RESET=true`.
- Os 5 usuários de teste da equipe (MVP 1) foram mantidos.
- Em 02/11 à noite, amigos do dono testam com contas próprias. Antes da apresentação, limpe essas contas (se o dono quiser) e restaure a demo com `DEMO_RESET=true`.

## Antes da apresentação
- Depois de ensaios, restaure a demo: rode o seed contra a produção com `DEMO_RESET=true` (veja o README).
- O roteiro está em `docs/tasks/mvp2/ROTEIRO.md`.

## Credenciais
OAuth GitHub: o botão só aparece com as variáveis definidas na Vercel. Quem grava as variáveis sensíveis é o dono. Em produção desde 03/11/2026: login com Google, SMTP com Gmail e senha de app e a página `/privacidade`, exigida pelo Google.

## Frontend v3 (03/11/2026)
Redesenho de todas as telas, com a marca mantida: régua arrastável com preços reais na home, jornada por rolagem, Triagem com régua ao vivo, painel com navegação lateral e figuras, autenticação em duas metades e movimento em todo o produto. Detalhes em `DESIGN.md`.

## Aprendizados de ambiente
- Com `next dev`, abra por `localhost`, não por `127.0.0.1`: o Next bloqueia os recursos de desenvolvimento e a página fica sem hidratação.
- `loading.tsx` em rota com `notFound()` faz a resposta sair 200 em vez de 404. O teste de autorização pegou isso no painel.
- O E2E usa `next start` sobre o build existente. Rode `pnpm build` antes de `pnpm test:e2e`.
- O browser do Orca tem um único pote de cookies para todas as worktrees. Para verificar telas logadas com workers em paralelo, use um Playwright isolado.
- O seed demo local exige `ALLOW_DEMO_SEED=true`.
- Falha intermitente vista uma vez: `auth.spec.ts:150` (query string longa).

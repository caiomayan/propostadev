# ADR 0002 — execução local e persistência
Status: implementado.

Sessão em Server Actions usa o cookie atual de next/headers, inclusive após rotação de senha: Better Auth revoga as sessões antigas e envia uma nova. Ler apenas os headers originais da requisição causava perda da sessão durante o rerender. Coberto por teste unitário e E2E com dois navegadores.

Não há loading global antes das verificações de existência/autorização. O perfil é validado no layout antes do loading da rota; assim perfis desativados e URLs privadas inválidas retornam HTTP 404 real, em vez de um not-found dentro de resposta streaming 200.

Versões fixadas no lockfile: Node 24, Next 16.4.0, React 19.3.0, Better Auth 1.7.7, Drizzle ORM 0.45.3, PostgreSQL 17.6. pnpm 11.25.0.

Cache Components foi desativado: as consultas do domínio são dinâmicas e os dados privados são lidos da sessão no servidor. O scaffold ativava cache e prefetch parcial; manter isso exigiria uma estratégia adicional não necessária ao MVP.

Auth schema gerado com a CLI oficial `auth@1.7.7`, incluindo rate_limit. `scripts/auth-generation.ts` é somente configuração de geração, sem conexão ao banco. `0000` registra tabelas/checks/índices; `0001` registra unaccent e triggers de timestamp, responsável imutável e impedimento de autoavaliação.

Server Actions autenticam e autorizam pela sessão; query pública seleciona somente campos destinados ao diretório. Auth HTTP usa rate limit persistente da biblioteca; actions usam tabela SQL com contador atômico de até 20 operações por minuto por identidade e escopo. Tentativas de login/cadastro usam hash do e-mail como chave. A preparação para lançamento público deve adicionar limites de rede e operação adequados ao ambiente.

Os componentes shadcn vieram do [registry oficial new-york](https://ui.shadcn.com/r/styles/new-york/button.json), após falhas de resolução da CLI neste ambiente. Tokens e composições seguem docs/DESIGN-SYSTEM.md; Radix cuida de foco, Escape e modalidade do Sheet.

Drizzle Kit 0.31.11 mudou seu carregador para tsx mas conserva uma dependência legada sem uso. O override remove somente `@esbuild-kit/esm-loader` desse pacote. [Changelog oficial](https://github.com/drizzle-team/drizzle-orm/blob/main/changelogs/drizzle-kit/0.31.10.md). Geração e execução de migrations foram verificadas.

Docker Desktop local falhou por sockets AF_UNIX obsoletos. As pastas temporárias `Docker/run` e `docker-secrets-engine` foram preservadas com sufixo `.stale-propostadev-20261006` e recriadas pela aplicação. Volumes e configurações foram preservados. Esta recuperação pertence ao ambiente, não ao fluxo de instalação do projeto.

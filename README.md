# Proposta.dev

Diretório de prestadores de desenvolvimento. Visitantes pesquisam, filtram, comparam até três prestadores e acessam contatos públicos. Uma conta pode publicar perfil PF/PJ, administrar ofertas e avaliar outros prestadores. Negociação externa; sem pagamentos ou contratação interna.


## Produção — Supabase e Vercel

Publicado em 07/10/2026: https://propostadev-one.vercel.app. PostgreSQL no Supabase em São Paulo; aplicativo na Vercel Hobby, conectado à branch main. Configuração feita pelo navegador.

Variáveis sensíveis na Vercel: DATABASE_URL (transaction pooler, porta 6543), BETTER_AUTH_SECRET (aleatório) e BETTER_AUTH_URL=https://propostadev-one.vercel.app. Nunca versionar os valores privados. A URL do banco usa sslmode=verify-full&sslrootcert=supabase-ca.crt; a senha deve estar codificada para URL.

Build Command na Vercel:

```sh
curl -fsS https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt -o supabase-ca.crt && pnpm db:migrate && node --conditions=react-server --import tsx scripts/seed.ts && pnpm build
```

A CA pública vem do endereço oficial apresentado pelo dashboard do Supabase. next.config.ts inclui supabase-ca.crt no tracing das funções. O arquivo é baixado em cada build; a verificação TLS permanece ativa. O comando do seed usa as variáveis do ambiente de hospedagem, sem exigir um .env local. Migrations e catálogo são incrementais/idempotentes; previews neste projeto usam a mesma base de produção e não devem executar alterações experimentais de schema.

As 11 tabelas public têm RLS habilitada, sem políticas de acesso para anon/authenticated. Privilégios de tabelas/sequências atuais e futuras desses papéis foram restringidos. O acesso do aplicativo acontece somente no servidor pelo PostgreSQL; Better Auth continua responsável pelas contas/sessões. Não usar Supabase Auth no frontend deste projeto.

Deploy, migrations e catálogo foram confirmados. Home, busca e redirecionamento privado foram validados no ambiente publicado; testes de autenticação usam uma conta QA sem perfil/oferta pública. Após um redeploy, recarregue formulários antigos antes de enviá-los, pois os identificadores das Server Actions podem mudar.

## Executar localmente

Requisitos: Node 24 e Docker Desktop com engine Linux ativo. PostgreSQL roda somente no container; aplicativo roda no host. As versões exatas estão no package.json e pnpm-lock.yaml.

```powershell
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
Copy-Item .env.example .env
```

Preencha BETTER_AUTH_SECRET com uma sequência aleatória de pelo menos 32 caracteres. Gere uma com `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64'))"`. Nunca publique .env. Os valores locais de POSTGRES_USER/PASSWORD/DB/PORT e DATABASE_URL devem coincidir. A porta do banco neste projeto é 5434; a do aplicativo é 3000.

```powershell
docker compose up -d --wait
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Abra http://localhost:3000. Cadastre uma conta, crie o perfil e publique uma oferta. O seed padrão contém apenas 3 categorias e 8 tipos de serviço; a ausência inicial de prestadores é um estado real.

## Demonstração opcional

O seed demo é recusado em produção e exige opt-in. Ele cria oito perfis fictícios, identificados como Demo, com preços variados e uma avaliação sintética. Use apenas para exploração local. Para identificar o ambiente inteiro, ajuste DEMO_MODE=true antes de iniciar/buildar o aplicativo.

```powershell
$env:ALLOW_DEMO_SEED='true'
pnpm db:seed:demo
```

Login local: prestador1@demo.example, senha Demo-local-2026! (ou DEMO_PASSWORD definido antes da primeira execução). Repetir o seed não redefine a senha de uma conta já existente. Não use essas credenciais em serviços públicos.

## Testes e produção local

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
pnpm start
```

Integração exige DATABASE_URL_TEST. O nome da base deve terminar em `_test` e ser diferente do banco de desenvolvimento. A preparação cria somente a base dedicada se ausente e aplica migrations. E2E usa essa base, seed demo e servidor de produção em http://localhost:3100; não reutiliza servidor existente. Os testes criam contas próprias e não limpam o banco de desenvolvimento. Não rode testes e script visual simultaneamente contra o servidor de teste.

Para screenshots, mantenha um servidor separado em 3100 apontando ao DATABASE_URL_TEST, BETTER_AUTH_URL=http://localhost:3100 e DEMO_MODE=true, então execute `pnpm exec tsx scripts/visual-qa.ts`. O script captura 375/768/1440px em artifacts/visual-qa e verifica overflow/status; inspeção visual humana continua necessária.

Resultados e limites reais: docs/VALIDATION.md. Escopo: docs/SCOPE.md. Regras: docs/specs/MVP.md e docs/DATABASE-RULES.md. Progresso: docs/tasks/BACKLOG.md. Decisões de implementação: docs/adr/0002-implementation.md.

## Dados e alterações

Sessões e hashes pertencem ao Better Auth; schema gerado com `pnpm auth:generate`. Domínio usa Drizzle e migrations SQL versionadas. Depois de alterar o schema, `pnpm db:generate`, revise o SQL e execute `pnpm db:migrate`. Não use push destrutivo. Triggers adicionais são uma migration separada, 0001_domain-rules.sql; domain-rules.sql serve apenas como fonte legível, não deve ser executado novamente manualmente.

`docker compose stop` preserva o volume. `docker compose up -d --wait` retoma os dados. Não execute down -v para reiniciar. Backup local: `docker compose exec -T db pg_dump -U proposta -d propostadev -Fc -f /tmp/propostadev.dump`, seguido de `docker compose cp db:/tmp/propostadev.dump ./propostadev.dump`. O dump contém dados pessoais: guarde fora do Git em armazenamento protegido. Restore em outra base vazia deve usar pg_restore com credenciais/nomes correspondentes. Para lançamento público, defina e teste política de backup e restore do ambiente real.

Auth HTTP tem limite persistente de 20 requisições/minuto e regras adicionais da biblioteca em endpoints sensíveis. Server Actions usam contador SQL atômico de até 20 operações/minuto por identidade e escopo (conta, perfil, oferta, avaliação); login/cadastro usam hash do e-mail. Todos os writes de domínio validam entrada e sessão; ofertas e avaliações verificam propriedade na consulta.

## Limites da entrega

Não há SMTP, recuperação/verificação de e-mail, moderação, upload, OAuth, pagamentos, demandas ou propostas internas. Não há alegação de contratação verificada. Domínio próprio, política de privacidade real, proteção operacional e moderação precisam de decisões próprias para a operação pública. O MVP foi publicado em Supabase/Vercel em 07/10/2026; veja a seção de produção.

O registry shadcn foi usado diretamente após falhas locais da CLI; componentes em src/components/ui foram personalizados com os tokens do projeto. A dependência legada não utilizada do Drizzle Kit foi removida via override; veja ADR 0002. O audit de runtime foi executado separadamente da auditoria de ferramentas de desenvolvimento.

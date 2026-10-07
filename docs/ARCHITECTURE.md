# Arquitetura e execução

## Stack
Next.js App Router + React, TypeScript strict, Tailwind CSS e shadcn/ui; Drizzle ORM/Drizzle Kit com driver pg; PostgreSQL 17 em Docker; Better Auth e-mail/senha + adapter Drizzle; Zod; Vitest e Playwright. pnpm com lockfile. Escolher versões estáveis compatíveis no início e registrar em README; sem canary ou dependências duplicadas.

PostgreSQL 17 é decisão explícita de versão para ambiente reproduzível, não afirmação de ser a versão mais recente. Pin da imagem por patch/digest quando viável. Node deve seguir os requisitos da versão de Next selecionada; registrar em .nvmrc e engines.

## Organização sugerida
- src/app: rotas e layouts; src/components/ui: componentes shadcn; src/components: composições do produto.
- src/modules/auth, providers, offers, catalog, reviews, search: validação e serviços por domínio.
- src/lib/db: conexão server-only, schema e queries; src/lib/auth: config e sessão server-only.
- drizzle/: migrations SQL; scripts/: seed; tests/: integração e E2E.
- docs/: fonte da especificação, decisões e tarefas.

Páginas leem via Server Components e consultas server-only. Mutações internas via Server Actions com Zod e autorização por operação. Route Handler apenas para Better Auth e interfaces que de fato necessitem HTTP. Não construir API REST inteira duplicando actions. Dados compartilhados não incluem segredos. Erros de formulário serializados com código/mensagem/campos.

## Auth
Usar Better Auth real, cookies HttpOnly, SameSite apropriado, Secure em produção, origins explícitas e secret por env. Cadastro com e-mail normalizado lowercase e nome; senha de 12 a 128 caracteres validada conforme biblioteca. Sem armazenamento de senha na tabela de domínio nem implementação de hashing própria. Sessões e hashes somente nas tabelas geradas pelo Better Auth. Logout invalida a sessão, troca de senha usa a API suportada e revoga outras sessões quando suportado. IDs de usuário são textuais para casar com auth.user.id.

Usar geração de schema compatível com a versão da biblioteca; incluir migrations das tabelas user/session/account/verification e quaisquer outras exigidas. docs/schema.dbml mostra somente o vínculo conceitual auth_user; nunca criar tabela duplicada de conta para atender ao diagrama.

## Banco
Docker Compose com imagem postgres:17, volume nomeado, porta 127.0.0.1:${POSTGRES_PORT:-5432}:5432 e healthcheck pg_isready. App no host usa localhost; se futuramente containerizado usa hostname do serviço, nunca localhost. .env.example: DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, POSTGRES_DB/USER/PASSWORD/PORT. Os valores de Compose e DATABASE_URL devem coincidir. Credenciais locais não servem à produção.

Scripts exigidos: dev, build, start, lint, typecheck, test, test:integration, test:e2e, db:generate, db:migrate, db:seed, db:seed:demo. Documentar sequência exata: instalar → copiar env → iniciar Docker → esperar healthcheck → migrar → seed catálogo → seed demo opcional → dev. Seeds de auth usam biblioteca/API oficial; não inserir hash inventado. Seed demo requer opt-in e recusa execução em produção.

Testes usam DATABASE_URL_TEST com banco dedicado; nunca apagar dados do banco de desenvolvimento. Migrations devem funcionar em banco vazio e aplicação precisa reiniciar preservando dados. Não executar down -v como rotina.

## Segurança e dados
Checagem de dono por sessão em cada action; validação de URL e telefone; queries parametrizadas; limitar tamanho/paginação; não expor e-mail de login/session/token/hash. Reputação e estatística calculadas por SQL sem duplicação causada por joins. Atualizações invalidam dados públicos relevantes e dados privados não entram em cache global. Tratar ações como endpoints acessíveis diretamente.

Ativar rate limiting de auth suportado pela biblioteca com persistência no banco quando disponível. Reviews/mutações: limitar frequência por usuário no banco e tamanho do payload, documentar configuração. Sem Redis na V1. Limites devem retornar erro claro, nunca bloquear leitura pública arbitrariamente.

Imagem externa: permitir apenas https, sem proxy de backend e sem fetch/otimização de URLs arbitrárias. Usar img normal com dimensões fixas, loading lazy, referrerPolicy no-referrer e fallback onError. Links externos http/https apenas; preferir https nos campos públicos; target blank com noopener noreferrer. Nenhum HTML de descrição/comentário é interpretado.

## Seeds
Catálogo: Web (Landing Page, Site institucional, E-commerce, Sistema web); Backend e APIs (API, Backend); Manutenção e Integrações (Manutenção web, Integração de sistemas). Slugs estáveis e upsert sem apagar ofertas.

Demo opcional: pelo menos 8 prestadores fictícios PF/PJ, vários formatos de preço/prazo, perfis sem foto, tipo com menos de 3 ofertas e tipo com amostra suficiente. Fotos não devem representar pessoas reais inventadas. Não usar depoimentos fictícios na home; resultados de demonstração têm marcação de ambiente demo.

## Observabilidade e preparação pública
Logs de erro sem senhas/tokens/contatos pessoais; mensagens de UI sem stack traces. Documentar backup do volume e restore em produção como próximo passo. Esta entrega valida execução local; hospedagem, SMTP, moderação, política de privacidade real e proteção operacional são decisões de lançamento posteriores.

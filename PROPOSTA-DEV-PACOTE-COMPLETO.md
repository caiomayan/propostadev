# Proposta.dev — pacote completo de implementação



---

# Arquivo: README.md

# Proposta.dev — pacote de implementação MVP

Versão 1.0 • 06/10/2026 • Português brasileiro

Este é um pacote de requisitos e execução, não um aplicativo já implementado. Extraia na raiz do repositório e envie ao agente o conteúdo de `PROMPT-AGENTE.md`. A primeira atividade é conferir o ambiente; a entrega esperada é o sistema funcionando com banco real, não apenas telas.

## Ordem de leitura
1. AGENTS.md e GLOSSARY.md.
2. docs/PRD.md e docs/SCOPE.md.
3. docs/ARCHITECTURE.md e docs/DESIGN-SYSTEM.md.
4. docs/schema.dbml e docs/specs/MVP.md.
5. docs/tasks/BACKLOG.md e docs/ACCEPTANCE.md.

## Decisões já tomadas
- Next.js App Router, TypeScript strict, Tailwind, shadcn/ui; monólito modular.
- PostgreSQL em Docker Compose, Drizzle ORM + migrations SQL versionadas, Better Auth com e-mail/senha e sessões persistidas.
- App executa localmente com Node; apenas o banco precisa de Docker. Sem Supabase, Redis ou backend separado.
- Usuário único; perfil de prestador opcional, PF ou PJ. Sem CPF/CNPJ na V1.
- Catálogo administrado por seed; ofertas próprias dos prestadores; descoberta, comparação e contato externo.
- Avaliações abertas a usuários autenticados, uma por usuário/prestador, sem autoavaliação.
- Sem contratação, propostas, pagamentos, demandas, triagem ou recomendação automática.

## Skills de Matt Pocock
Instale no seu repositório com `npx skills@latest add mattpocock/skills`, escolhendo o agente de destino. O repositório oficial recomenda incluir `setup-matt-pocock-skills` e executar o setup por repositório. Configure documentos em `docs/`, glossário em `GLOSSARY.md` e tracker local em `docs/tasks/`.

Os nomes das skills mudam entre versões: confira a instalação. O fluxo atual consultado é entrevista (`grill-me`/`grill-with-docs`), síntese de PRD (`to-prd`) e decomposição (`to-issues`); versões anteriores usavam `write-a-prd` e `prd-to-issues`. O pacote já contém o resultado desses passos. Use a entrevista apenas para bloqueios novos; não refaça todas as perguntas e não recrie o PRD sem motivo. Skills complementam SDD; não substituem specs e testes. Não há skills instaladas dentro deste ZIP.

## Como entregar ao agente
Cole PROMPT-AGENTE.md e permita leitura desta pasta. Ele deve implementar uma fatia funcional por vez, atualizar o backlog, testar, revisar e continuar até concluir o MVP. Não é preciso uma aprovação entre cada tarefa. Publicação, domínio e serviços pagos ficam fora desta entrega.

Fontes técnicas consultadas: docs/SOURCES.md. Escolhas de produto são decisões deste projeto, não regras prescritas por essas fontes.


---

# Arquivo: PROMPT-AGENTE.md

# Instrução para o agente implementador

Você é responsável por implementar TODO o MVP Proposta.dev neste repositório. Trabalhe até existir um sistema executável e verificado, seguindo SDD e os documentos fornecidos. Este pacote foi aprovado como direção de produto; não comece outra entrevista completa.

Leia README.md, AGENTS.md, GLOSSARY.md, docs/PRD.md, docs/SCOPE.md, docs/ARCHITECTURE.md, docs/DESIGN-SYSTEM.md, docs/schema.dbml, docs/specs/MVP.md, docs/tasks/BACKLOG.md e docs/ACCEPTANCE.md antes de editar código.

Comece inspecionando o repositório e as instruções existentes. Preserve arquivos e trabalho anteriores. Se vazio, inicialize Next.js App Router com TypeScript strict, Tailwind e shadcn/ui. Use PostgreSQL em Docker Compose, Drizzle, Better Auth, Zod, Vitest e Playwright. Verifique versões estáveis e compatibilidade nas documentações oficiais e registre o conjunto escolhido. Nunca instale PostgreSQL no host.

Execute T00 a T10 do backlog respeitando dependências. Cada fatia deve integrar tela, validação, autorização, banco e testes pertinentes. Crie migrations SQL, seeds idempotentes, env de exemplo e README operacional. Não use arrays estáticos como substituto do banco nem autenticação simulada. Dados fictícios pertencem apenas ao seed de demonstração e devem ser identificados como tal.

Se as skills de Matt Pocock estiverem instaladas, leia as relevantes. Use configuração com tracker local, PRD fornecido e tarefas em docs/tasks; não publique issues automaticamente. Não invente que executou skills inexistentes. Se faltarem, siga os documentos e continue. Use grill-me/grill-with-docs apenas diante de contradição material não resolvida. Decisões reversíveis podem ser tomadas e registradas em ADR.

O design deve ser neutro e sóbrio, com shadcn/ui personalizado conforme tokens e composições especificados. Evite o visual genérico de landing page gerada por IA. O foco é a busca e o diretório de prestadores. Não implemente funcionalidades fora do escopo.

Você pode delegar subtarefas a agentes se seu ambiente permitir; mantenha um responsável pela integração e atribua propriedade de arquivos para evitar conflitos. A delegação é opcional. Não deixe cada agente inventar schemas ou design systems próprios.

Ao final, execute lint, typecheck, testes unitários/integração/E2E e build. Inspecione visualmente mobile e desktop. Informe os comandos executados, resultados, limitações reais e como rodar. Não declare sucesso de um teste que não rodou. Se um serviço externo impedir uma parte, conclua o restante e documente o bloqueio específico. Não faça deploy, pagamentos ou publicação externa nesta tarefa.

Comece agora pela inspeção e T00; prossiga até o MVP completo.


---

# Arquivo: AGENTS.md

# Regras do projeto Proposta.dev

## Autoridade e execução
Requisitos explícitos do usuário prevalecem. Para este pacote: SCOPE/PRD definem produto; specs definem comportamento; schema define persistência; design system define apresentação; backlog define execução. Divergências entre documentos devem ser resolvidas antes de implementar o comportamento afetado e registradas em ADR. O .mwb e o board originais são históricos e não prevalecem sobre este pacote.

Não solicite aprovação para escolhas reversíveis já abrangidas. Não acrescente funcionalidades por iniciativa própria. Preserve instruções anteriores do repositório e reporte conflitos. Use docs/tasks/BACKLOG.md como tracker local. Atualize status e evidência, não apenas marque tarefas como prontas.

## Código
- TypeScript strict, sem any para ocultar erro; nomes de domínio conforme GLOSSARY.
- Server Components por padrão; Client Components somente para interação.
- Banco, secrets, auth e autorização em módulos server-only.
- Toda mutação valida entrada e sessão e verifica proprietário no servidor.
- Nunca confie em usuario_id/prestador_id enviados pelo cliente para autorização.
- SQL parametrizado. Dinheiro decimal como string/decimal, sem aritmética financeira em float.
- Sem arquiteturas de microserviços, repository genérico, event bus ou abstrações especulativas.
- Componentes de UI reutilizáveis quando houver uso real; não copiar páginas inteiras.
- Segredos fora do git. .env.example apenas com placeholders ou credenciais locais descartáveis.
- Migrations incrementais versionadas; não usar push destrutivo como fluxo normal.
- Schema de auth é gerado pela versão do Better Auth; não reinventar suas tabelas.
- Tests verificam comportamento observável, constraints e acesso indevido; sem snapshots maciços.

## Conclusão
Cada tarefa tem evidência de aceite; se teste bloquear, registrar causa e continuar no independente. Não marcar implementação parcial como concluída. Atualizar README, progresso e decisões ao retomar sessões. Não criar commits, issues ou deploy externos sem instrução do usuário para isso. Nenhum coautor de IA deve ser acrescentado a commits.


---

# Arquivo: GLOSSARY.md

# Glossário

| Termo | Significado |
|---|---|
| Usuário | Conta autenticável; qualquer conta pode consumir serviços. |
| Prestador | Perfil opcional de uma conta, PF ou PJ, capaz de publicar ofertas. |
| Cliente | Papel de quem busca/contata, não tabela nem tipo exclusivo de conta. |
| Categoria | Agrupamento simples do catálogo, como Desenvolvimento Web. |
| Tipo de serviço | Item padronizado do catálogo, como Landing Page. |
| Oferta | Anúncio do prestador vinculado a um tipo de serviço, com preço/prazo próprios. |
| Avaliação | Nota e comentário de usuário sobre um prestador; não comprova contratação. |
| Contato | Acesso voluntário a e-mail/telefone/link; negociação ocorre externamente. |
| Comparação | Seleção local de até três prestadores/ofertas para confronto de dados. |
| Preço anunciado médio | Estatística de ofertas elegíveis; não orçamento nem transação concluída. |
| Ativo | Publicável, elegível para busca; exige perfil válido e ativo. |
| Oferta pausada | Continua no painel do dono, ausente dos resultados públicos. |
| V1 / MVP | Descoberta, comparação, perfil, oferta, avaliações e contato externo. |


---

# Arquivo: docs/PRD.md

# PRD — Proposta.dev

## Problema e proposta
Pequenos negócios e pessoas têm dificuldade de descobrir desenvolvedores de software, comparar serviços e entender preços e prazos anunciados. Prestadores precisam de uma vitrine simples com informações consistentes e caminhos de contato.

Proposta.dev conecta essas pessoas por um catálogo de serviços e perfis públicos. O cliente pesquisa, filtra, compara e contata prestadores. O prestador cria perfil e ofertas. A plataforma não intermedeia negociação ou contratação na V1.

## Objetivos
1. Permitir descobrir prestadores por tipo de serviço com preços/prazos transparentes.
2. Permitir que uma conta publique ofertas sem perder a possibilidade de consumir serviços.
3. Mostrar reputação declarada pelos usuários e estatísticas de preços com critérios explícitos.
4. Entregar aplicação monolítica utilizável e verificável localmente com banco persistente.

O board original registra meta de 20 desenvolvedores e 30 solicitações em 30 dias e entrega final até dezembro/2026. Isso é uma hipótese de negócio, não requisito de aprovação técnica. Como não há solicitação interna na V1, não interpretar clique como orçamento solicitado ou contratação. O prazo anterior de 07/10/2026 deve ser tratado como histórico; este pacote não garante execução em um dia.

## Personas
- Visitante/cliente: quer entender opções sem conhecimento técnico aprofundado.
- Prestador PF: quer divulgar especialidade, experiência e preço de referência.
- Prestador PJ: quer divulgar marca e serviços de uma empresa, inicialmente com uma conta responsável.
- Usuário autenticado: pode avaliar outros prestadores e manter dados próprios.

## Histórias e requisitos
| ID | História / requisito | Prioridade |
|---|---|---|
| RF01 | Visitante pode pesquisar, filtrar e navegar sem login. | Must |
| RF02 | Usuário pode cadastrar-se, entrar, sair e editar nome/senha. | Must |
| RF03 | Usuário pode criar um perfil PF/PJ e continuar como consumidor. | Must |
| RF04 | Prestador pode editar/ativar/desativar seu perfil e seus contatos públicos. | Must |
| RF05 | Prestador pode criar, editar, pausar e excluir logicamente ofertas próprias. | Must |
| RF06 | Ofertas pertencem a tipo de serviço padronizado e mostram preço/prazo estruturados. | Must |
| RF07 | Busca exibe ofertas agrupadas por prestador, filtros e paginação determinística. | Must |
| RF08 | Visitante pode comparar até três resultados com contexto da oferta selecionada. | Must |
| RF09 | Perfil público mostra ofertas ativas, contatos, nota agregada e avaliações. | Must |
| RF10 | Usuário logado pode avaliar, editar ou excluir sua avaliação, exceto a si mesmo. | Must |
| RF11 | Tipo de serviço pode exibir média de preços anunciados elegíveis e quantidade da amostra. | Must |
| RF12 | Dados e operações são persistidos e autorizados no servidor. | Must |

## Jornada principal
Home com busca → resultados → filtros/seleção → comparação opcional → perfil → contato externo. Visitante não precisa criar demanda nem se cadastrar para contatar.

Jornada do prestador: cadastro/login → painel → perfil obrigatório → oferta → publicar → aparece na busca. Sem oferta ativa, perfil pode ter URL pública mas não participa dos resultados.

## Escopo qualitativo
UI em pt-BR, moeda BRL, layout responsivo, foco por teclado e mensagens claras. Ausência de ofertas/avaliações é um estado real e deve ser explicada. Foto é opcional, fallback por iniciais. Contatos públicos são diferentes do e-mail privado de login.

## Fora do escopo
Propostas, projetos/demandas, contratos, contratação exclusiva, pagamentos/taxas, chat, inbox, notificações de orçamento, triagem, recomendação por IA, uploads, projetos de portfólio, favoritos, OAuth, equipes empresariais, CPF/CNPJ/verificação documental, mapas e painel administrativo. Catálogo administrado por seed versionado.

Recuperação de senha e verificação de e-mail são evolução para lançamento público: a entrega local funciona sem provedor de e-mail e não exibe botões sem backend. Antes de lançar para público, tratar essas capacidades como checklist de preparação; não simular envio nem alegar e-mail verificado.

## Sucesso e entrega
Aceite técnico em docs/ACCEPTANCE.md. Sucesso de produto exige adoção real e não pode ser inferido de seed. Métricas operacionais na V1: contagem de perfis e ofertas ativos obtida por SQL; métricas de contatos podem ser adicionadas posteriormente, sem identificar cliques como conversões reais.

## Riscos e escolhas
Avaliações não comprovam contratação; mostrar isso junto à reputação. Poucos anúncios reduzem validade da média; ocultar abaixo de 3 prestadores distintos elegíveis. Perfis PJ têm um dono apenas na V1. Contato público requer consentimento explícito no formulário. Um marketplace aberto precisará de moderação e resposta a abuso antes de expansão; não criar selo de verificação inexistente.


---

# Arquivo: docs/SCOPE.md

# Limites e decisões aprovadas

A entrevista mais recente substitui o desenho original do MySQL Workbench e os requisitos mais amplos do board. O histórico falava em cliente/prestador exclusivos, triagem, demandas, propostas e taxas. Nada disso deve ser recuperado automaticamente.

## Decisões preenchidas para permitir execução
- Primeira versão concentrada em desenvolvimento web: Web, Backend e APIs, Manutenção e Integrações. Mobile/Desktop ficam para expansão do seed.
- PF/PJ descreve o perfil, sem documentos nem validação jurídica. Não usar freelancer na UI.
- Um perfil por usuário; PJ pode usar nome comercial; sem contas de equipe.
- UUID para perfil/oferta/catálogo/avaliação; usuário usa o ID nativo textual da biblioteca de auth.
- Experiência registrada como anos inteiros autodeclarados, editáveis; não aumentada automaticamente.
- Localização opcional: cidade/UF/país, sem endereço completo. Serviços podem ser remotos.
- Foto por URL HTTPS, opcional; sem upload ou fetch de imagem no backend.
- E-mail público obrigatório para perfil ativo; telefone/WhatsApp opcionais.
- Uma oferta ativa por prestador/tipo de serviço; pode editar ou criar outra após pausar a anterior.
- Faixas devem respeitar máximo >= mínimo; sem limite percentual arbitrário de amplitude na V1.
- Prazo em dias corridos estimados; não garantia de entrega. Por hora não exige prazo fixo.
- Comparação até três prestadores distintos, persistida localmente, sem conta/favoritos.
- Avaliação nota inteira 1–5, comentário opcional até 2.000 caracteres; uma por usuário/prestador.
- Ordenação padrão alfabética por nome do perfil + ID; sem ranking de relevância opaco.
- Conta não tem endpoint de exclusão automatizada nesta V1; não publicar políticas fictícias ou prometer processos inexistentes.

Mudanças em must-have ou regras financeiras precisam atualizar PRD, spec, migration/DBML, testes e ADR. Melhorias visuais compatíveis com os tokens não exigem reabrir produto.


---

# Arquivo: docs/ARCHITECTURE.md

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


---

# Arquivo: docs/DESIGN-SYSTEM.md

# Identidade e design system — Proposta.dev

## Direção
Diretório editorial de profissionais: discreto, legível, concreto. A busca é o principal elemento. A marca é wordmark tipográfico `Proposta.dev`; .dev pode ter contraste secundário. Sem logotipo complexo necessário para começar. A estética deve aparecer no produto inteiro, não apenas na home.

## Tokens iniciais (light)
| Token | Valor | Uso |
|---|---|---|
| background | #FAFAF9 | Fundo geral |
| surface/card | #FFFFFF | Superfícies |
| foreground | #18181B | Texto e CTA principal |
| muted | #F4F4F5 | Estados secundários |
| muted-foreground | #52525B | Metadados |
| border/input | #E4E4E7 | Divisórias e campos |
| primary | #18181B | CTA |
| primary-foreground | #FFFFFF | Texto em CTA |
| focus/ring | #52525B | Foco visível |
| destructive | #B91C1C | Erros/ações destrutivas |
| success | #166534 | Confirmações pontuais |

Mapear tokens para variáveis CSS do shadcn, não espalhar hex por componentes. Verificar contraste real; border não comunica sozinho estados. Sem dark mode na V1. Uma única fonte sans (Geist ou equivalente local), com fallback system; sem depender de rede para build. Texto 14–16px, corpo 16px; heading de página 28–36px. Peso 400/500/600; sem títulos gigantes.

Spacing: 4, 8, 12, 16, 24, 32, 48, 64px. Contêiner público máximo 1200px, gutters 16px mobile/24px desktop. Radius 6–8px (botões 6, cards 8); sombras leves apenas para menus/dialogs. Divisórias e alinhamento prevalecem. Ícones Lucide consistentes 16/20px, sempre junto a rótulo onde o significado não é universal.

## Composição por página
- Header compacto com marca, Buscar desenvolvedores, Oferecer serviços e conta. Mobile menu acessível.
- Home: título “Encontre quem desenvolve sua próxima ideia”, texto curto, busca, tipos de serviço; abaixo explicação de preço/prazo e convite a prestadores. Sem banners decorativos e números fictícios.
- Busca desktop: filtros laterais 240px + lista; mobile filtros em Sheet, chips de filtros ativos e contagem. Resultados em linhas/cards horizontais discretos, não grade gigante de cartões vazios.
- Resultado: avatar/initials, nome, PF/PJ, experiência, localização/remoto, avaliação + total, oferta contextual, preço formatado, prazo, ver perfil e comparar.
- Comparação: tabela de até 3 prestadores, nome/serviço/preço/modelo de cobrança/prazo/experiência/reputação/contato. Em mobile permitir scroll horizontal com cabeçalhos claros. Unidades incompatíveis explicitamente indicadas.
- Perfil: identidade e contato no topo; descrição e ofertas; avaliações em seção própria. Email/WhatsApp/site são CTAs distintos e sinceros, nunca “Contratar agora”.
- Painel: navegação Perfil / Minhas ofertas / Conta; formulários agrupados em seções com labels, exemplos e erros por campo.

## shadcn/ui
Usar Button, Input, Textarea, Select, Form/Field conforme versão, Dialog/AlertDialog, Sheet, Badge, Avatar, Separator, Table, Skeleton, Tooltip, Checkbox e feedback toast quando útil. Customizar composições/tokens. Não instalar bibliotecas concorrentes de componentes. Toast complementa estado visível, não substitui erro de campo.

## Evitar IA slop
Sem gradientes roxos/azuis, glow, blobs, glassmorphism, emojis como ícones, animações de entrada repetidas, dashboard com métricas fictícias, hero gigantesco, bento grid arbitrária, badges “revolucionário”, depoimentos inventados ou excesso de pílulas/cartões. Sem cores especiais para cada categoria. Não encher vazio com decoração. Não transformar o produto em landing page de agência.

Microcopy direta: “Buscar serviços”, “Ver perfil”, “Comparar”, “Publicar oferta”, “Pausar oferta”, “Entrar em contato”. Data e números pt-BR; BRL via Intl.NumberFormat, valores por hora com /hora. “Ainda não recebeu avaliações”, nunca estrelas 0 interpretadas como nota ruim.

## Estados e QA
Todas as rotas precisam de loading, vazio, erro recuperável e sucesso quando aplicável. Enter envia formulário, teclado percorre controles, Dialog devolve foco e Escape fecha. Labels persistentes, aria para estrelas, erros associados, foco visível. Inputs no mínimo 16px no mobile e alvos interativos confortáveis (aprox. 44px). Respeitar reduced-motion; transições 120–180ms apenas utilitárias.

Inspecionar screenshots em 375px, 768px e 1440px com dados reais do seed. Sem overflow da página; somente a tabela de comparação pode rolar. Confirmar textos longos, e-mail longo, avatar ausente, preço sob consulta e nota ausente.


---

# Arquivo: docs/specs/MVP.md

# Especificação comportamental SDD — MVP

## S01 Contas e autorização (RF02, RF12)
Cadastro nome 2–100 chars, e-mail válido normalizado e senha 12–128. Mensagens de login não distinguem conta inexistente de senha incorreta. Login redireciona para destino interno validado (sem open redirect). Logout remove acesso privado. Perfil prestador usa usuário da sessão, nunca escolhido pelo formulário. Conta pode editar nome e trocar senha pela API de auth, sem mudança de email na V1.

Visitante tem leitura pública; usuário tem leitura/edição de conta própria e avaliação de terceiros; dono do perfil pode gerir perfil e ofertas; ninguém pode alterar outro usuário. Rotas privadas redirecionam a entrar, mutations sem auth recusam mesmo que a UI esteja escondida.

## S02 Perfil (RF03, RF04, RF09)
Campos obrigatórios ao criar/publicar: tipo PF/PJ, nome_exibicao 2–100, descricao 30–5.000, anos_experiencia inteiro 0–80, email_contato válido, consentimento para publicação dos contatos. Slug gerado a partir do nome + sufixo curto, único e imutável na V1. Usuário não informa dono. Permitir rascunho apenas se existir estratégia consistente: nesta V1 criação exige os obrigatórios, perfil nasce ativo.

Opcionais: foto_url, cidade, uf, pais (default BR), telefone (E.164), whatsapp (E.164), site_url, github_url, linkedin_url. URLs até 2.048 chars HTTPS. UF deve ter 2 letras se país BR; localização ausente mostra “Localização não informada”, não assumir presença física/remoto verificado. Experiência e PF/PJ autodeclaradas. Link WhatsApp usa dígitos E.164 sem + em wa.me; email usa mailto; telefone tel. Sem texto pré-preenchido com dados sensíveis.

Desativar perfil o remove de busca, estatísticas, comparação válida e rota pública (404); preserva ofertas/avaliações no banco. Reativar o torna disponível com ofertas ainda ativas. Essa decisão deve ser explícita no diálogo. Perfil ativo sem ofertas pode ser acessado por URL, mas não aparece na busca.

## S03 Catálogo/ofertas (RF05, RF06)
Categoria 1:N tipo_servico; tipo_servico 1:N oferta; perfil 1:N oferta. Catálogo somente seed/admin técnico, sem criação arbitrária por prestador. Oferta: título 5–120, descrição 30–5.000, tipo de serviço ativo, tipo_preco, min/max, tipo_prazo, dias min/max, ativo, deleted_at. Rascunho/pausada não pública. Valor positivo no máximo 99.999.999,99; decimal duas casas. Prazo inteiro 1–3.650 dias quando informado.

| Modelo preço | mínimo | máximo |
|---|---|---|
| FIXO | obrigatório positivo | null |
| A_PARTIR_DE | obrigatório positivo | null |
| INTERVALO | obrigatório positivo | obrigatório >= mínimo |
| POR_HORA | obrigatório positivo | null |
| SOB_CONSULTA | null | null |

FIXO é uma possibilidade adicional útil compatível com a entrevista; os quatro formatos explicitamente pedidos permanecem. Não gravar strings “R$ 1.500” no banco. Tipo INTERVALO com valores iguais é permitido, exibido como valor único sem alterar tipo persistido.

| Modelo prazo | dias mínimo | dias máximo |
|---|---|---|
| FIXO | obrigatório | null |
| A_PARTIR_DE | obrigatório | null |
| INTERVALO | obrigatório | obrigatório >= mínimo |
| A_COMBINAR | null | null |

Troca de modelo limpa valores incompatíveis no formulário e servidor rejeita payload incoerente. Uma oferta ativa não excluída por prestador/tipo (unique parcial); concorrência gera erro amigável. Não aceitar categorias de tipos inativos em publicação. Pausar preserva oferta; excluir define deleted_at e ativo=false. Dono pode listar pausadas; excluídas não são restauradas pela UI V1.

## S04 Busca (RF01, RF07)
GET /buscar com q, categoria, tipo, pessoa, experiencia_min, nota_min, modelo_preco, preco_min, preco_max, prazo_ate, ordenar, pagina. Tudo validado em servidor; limites e enums inválidos voltam a valores seguros/erro de filtro claro. q até 120 chars; pagina 1–1.000 e 12 prestadores por página. Query string preserva filtros e reset de pagina quando filtros mudam.

Texto case-insensitive/accent-insensitive em nome do perfil, título/descrição da oferta, nome do tipo e categoria. Usar unaccent em migration + SQL parametrizado/escape de curingas, ou alternativa documentada testada. Apenas perfis ativos com ofertas ativas não excluídas em tipos/categorias ativos.

Aplique condições sobre a MESMA oferta: preço/prazo/tipo não podem ser satisfeitos por anúncios diferentes de um mesmo prestador. Agrupe resultados por prestador. Oferta representativa: a que passou filtros, escolhida por título + ID quando houver empate. Permita ver outras ofertas no perfil.

Filtros financeiros exigem modelo_preco explícito, exceto SOB_CONSULTA que desabilita valores. FIXO/POR_HORA: mínimo dentro do intervalo pedido; A_PARTIR_DE: preço anunciado mínimo dentro do intervalo (não promessa de custo final); INTERVALO: sobreposição das faixas. Não misturar R$/hora com R$/projeto. Ordenação por preço requer modelo numérico único; ordenar por preco_minimo, nome, ID. Sob consulta não possui ordenação numérica. Ordenação padrão nome; por nota média desc, quantidade desc, nome, ID (sem nota por último); por experiência desc, nome, ID. Contagens e agregados sem duplicação por joins.

prazo_ate: considerar FIXO por mínimo e INTERVALO por máximo <= limite; A_PARTIR_DE/A_COMBINAR são excluídos, pois não garantem limite superior. UI explica filtro como “Prazo estimado de até X dias”. Nota mínima exclui sem avaliações. Falta de resultados mostra remover filtros.

## S05 Comparação (RF08)
Selecionar 2–3 prestadores distintos, guardando oferta contextual por prestador. Até 3, mensagem no quarto. Persistir apenas IDs em localStorage (sem contato/sessão) e reidratar dados pelo servidor em /comparar?ofertas=id,id. URL compartilhável até três IDs válidos; sem login. Remover inativos/excluídos com aviso, prevenir repetição do mesmo prestador. Uma seleção permite página com orientação para adicionar outro; zero mostra estado vazio. Mudança de oferta do mesmo prestador substitui o contexto. Preços incompatíveis aparecem lado a lado com suas unidades sem indicação enganosa de “mais barato”.

## S06 Avaliações (RF10)
Qualquer usuário autenticado pode avaliar um perfil ativo de terceiros, inclusive se também presta serviços. Uma avaliação por par usuario/prestador. Nota inteira 1–5, comentário opcional 0–2.000 plain text. Nome do autor público; e-mail privado nunca. Avatar público do autor não é necessário. Criar/editar/excluir próprias; SQL UNIQUE e check de nota; self-review impedida por trigger e servidor. Edição conserva created_at, altera updated_at. Excluir remove a linha na V1. Média e contagem derivadas; média formatada em uma casa, contagem real. Sem avaliação mostrar “Sem avaliações”.

Avaliações listadas com paginação 10, recentes primeiro, ID para desempate. Mostrar texto “Avaliações de usuários da plataforma; contratação não verificada.” Não adicionar badges cliente verificado. Autorização independe de ID recebido.

## S07 Média de preços (RF11)
Não calcular média de contatos, transações ou preços finais. Para um tipo específico, apenas ofertas FIXO ativas de perfis/catálogo ativos e não excluídas; ao menos 3 prestadores distintos. Como há uma oferta ativa por par, cada prestador contribui uma vez. AVG(numeric), arredondar para duas casas na apresentação, incluir n e texto “Média dos preços fixos anunciados; não é orçamento”.

Exemplo de aceite: FIXO 800, 1000 e 1200 de três prestadores → R$ 1.000,00, n=3. Ofertas por hora, intervalos, a partir de e sob consulta ficam fora. Com n=2 mostrar “Dados insuficientes para calcular uma média”. Filtrar busca por outras condições não muda o indicador global do tipo; rotular “Neste tipo de serviço”. Sem tipo selecionado, não apresentar média combinada de serviços diferentes. Não exibir mediana/faixa típica como se estivesse implementada; é evolução.

## S08 Rotas e estados
| Rota | Acesso | Conteúdo |
|---|---|---|
| / | Público | Busca principal/catálogo |
| /buscar | Público | Filtros e resultados |
| /prestadores/[slug] | Público | Perfil/ofertas/avaliações/contatos |
| /comparar | Público | Comparação |
| /entrar e /cadastro | Público | Auth |
| /painel | Autenticado | Próxima ação e links reais, sem métricas falsas |
| /painel/perfil | Autenticado | Criar/editar perfil |
| /painel/ofertas | Dono com perfil | Lista e estados |
| /painel/ofertas/nova | Dono com perfil | Criar |
| /painel/ofertas/[id]/editar | Dono | Editar |
| /painel/conta | Autenticado | Nome/senha |

Oferta sem perfil leva a criar perfil com orientação. 404 real para perfis invisíveis. loading.tsx/error.tsx/not-found conforme apropriado. Ações devem exibir pendência e impedir duplo clique; servidor continua garantindo concorrência.


---

# Arquivo: docs/schema.dbml

Project proposta_dev {
  database_type: 'PostgreSQL'
  Note: 'Modelo de domínio V1. auth_user é projeção conceitual de user do Better Auth; migrations da auth vêm da biblioteca. Checks e índices parciais adicionais em DATABASE-RULES.md.'
}
Enum tipo_prestador {
  PESSOA_FISICA
  PESSOA_JURIDICA
}
Enum tipo_preco {
  FIXO
  A_PARTIR_DE
  INTERVALO
  POR_HORA
  SOB_CONSULTA
}
Enum tipo_prazo {
  FIXO
  INTERVALO
  A_PARTIR_DE
  A_COMBINAR
}
Table auth_user {
  id text [pk, note: 'ID nativo da auth; nome físico user/schema conforme adapter. Não criar conta paralela.']
  name text [not null]
  email text [not null, unique]
  email_verified boolean [not null, default: false]
  created_at timestamptz [not null]
  updated_at timestamptz [not null]
  Note: 'Projeção parcial; session/account/verification e campos adicionais devem ser gerados pela versão instalada de Better Auth.'
}
Table perfil_prestador {
  id uuid [pk, default: `gen_random_uuid()`]
  usuario_id text [not null, unique]
  slug varchar(160) [not null, unique]
  tipo tipo_prestador [not null]
  nome_exibicao varchar(100) [not null]
  descricao text [not null]
  anos_experiencia smallint [not null]
  foto_url text
  cidade varchar(100)
  uf varchar(2)
  pais varchar(2) [not null, default: 'BR']
  email_contato varchar(254) [not null]
  telefone varchar(20)
  whatsapp varchar(20)
  site_url text
  github_url text
  linkedin_url text
  contatos_publicados_em timestamptz [not null, note: 'Consentimento explícito para exposição dos contatos; não é aceite de política genérica.']
  ativo boolean [not null, default: true]
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]
}
Table categoria {
  id uuid [pk, default: `gen_random_uuid()`]
  nome varchar(100) [not null]
  slug varchar(120) [not null, unique]
  ativo boolean [not null, default: true]
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]
}
Table tipo_servico {
  id uuid [pk, default: `gen_random_uuid()`]
  categoria_id uuid [not null]
  nome varchar(100) [not null]
  slug varchar(120) [not null, unique]
  descricao text
  ativo boolean [not null, default: true]
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]
  indexes {
    categoria_id
  }
}
Table oferta_servico {
  id uuid [pk, default: `gen_random_uuid()`]
  prestador_id uuid [not null]
  tipo_servico_id uuid [not null]
  titulo varchar(120) [not null]
  descricao text [not null]
  tipo_preco tipo_preco [not null]
  preco_minimo numeric(10,2)
  preco_maximo numeric(10,2)
  tipo_prazo tipo_prazo [not null]
  prazo_minimo_dias integer
  prazo_maximo_dias integer
  ativo boolean [not null, default: false]
  deleted_at timestamptz
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]
  indexes {
    prestador_id
    (tipo_servico_id, ativo)
  }
  Note: 'SQL: unique parcial (prestador_id,tipo_servico_id) WHERE ativo AND deleted_at IS NULL; checks dependentes de tipo_preco/tipo_prazo obrigatórios.'
}
Table avaliacao {
  id uuid [pk, default: `gen_random_uuid()`]
  usuario_id text [not null]
  prestador_id uuid [not null]
  nota smallint [not null]
  comentario text
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]
  checks {
    `nota BETWEEN 1 AND 5` [name: 'avaliacao_nota_valida']
    `comentario IS NULL OR char_length(comentario) <= 2000` [name: 'avaliacao_comentario_limite']
  }
  indexes {
    (usuario_id, prestador_id) [unique]
    (prestador_id, created_at)
  }
}
Ref: perfil_prestador.usuario_id - auth_user.id [delete: cascade]
Ref: tipo_servico.categoria_id > categoria.id [delete: restrict]
Ref: oferta_servico.prestador_id > perfil_prestador.id [delete: cascade]
Ref: oferta_servico.tipo_servico_id > tipo_servico.id [delete: restrict]
Ref: avaliacao.usuario_id > auth_user.id [delete: cascade]
Ref: avaliacao.prestador_id > perfil_prestador.id [delete: cascade]


---

# Arquivo: docs/DATABASE-RULES.md

# Regras de persistência que complementam o DBML

DBML é documento do domínio; migrations executáveis são obrigatórias. Não considerar default now() como atualização automática de updated_at.

1. Auth gerada pela biblioteca, incluindo PK e sessão/account/verification. FK usuario_id de domínio aponta ao user.id físico correto. Uma conta tem zero ou um perfil; UNIQUE usuario_id.
2. Trigger SQL updated_at em UPDATE nas tabelas de domínio, evitando divergência entre actions e scripts; auth respeita comportamento próprio da biblioteca.
3. UNIQUE parcial oferta (prestador_id, tipo_servico_id) WHERE ativo=true AND deleted_at IS NULL. Sem UNIQUE geral do par: ofertas pausadas anteriores podem coexistir. CHECK deleted_at IS NULL OR ativo=false.
4. Anos experiência BETWEEN 0 AND 80; descrições perfil/oferta entre 30 e 5.000 caracteres; nomes/títulos conforme spec; textos obrigatórios trim não vazio.
5. Preço CHECK com ramificações completas: SOB_CONSULTA exige ambos NULL; FIXO/A_PARTIR_DE/POR_HORA exigem min > 0 e max IS NULL; INTERVALO exige ambos não nulos, min > 0, max >= min. Escrever IS NOT NULL explícito para não deixar CHECK retornar UNKNOWN e aceitar payload inválido. Limite numérico garantido por numeric(10,2).
6. Prazo CHECK completo: A_COMBINAR exige ambos NULL; FIXO/A_PARTIR_DE exigem min não NULL BETWEEN 1 AND 3650 e max NULL; INTERVALO exige ambos não NULL e 1 <= min <= max <= 3650.
7. Avaliação: CHECK nota 1–5, UNIQUE par, limite comentário. Trigger BEFORE INSERT OR UPDATE consulta dono de prestador e recusa usuario_id igual ao dono. Dono do perfil não pode ser transferido na V1 (sem endpoint, mais trigger para bloquear mudança em usuario_id), impedindo self-review por transferência. Aplicação também verifica para mensagem amigável.
8. Integridade de ativação: aplicação valida catálogo/perfil antes de publicar; leitura pública sempre aplica estado de todas as entidades. Desativação do perfil não altera ativo individual das ofertas; reativação restaura visibilidade.
9. FK com cascades na exclusão física excepcional de usuário/perfil; catálogo com RESTRICT. A UI apenas desativa perfil/exclui logicamente oferta; não expõe deleção física de conta.
10. Índices por FKs e avaliações prestador/data; unique slug. unaccent via CREATE EXTENSION IF NOT EXISTS unaccent e pesquisa com limites. Otimizações trigram/FTS são opcionais se medição justificar, não requisito para MVP pequeno.

## Verificação mínima por SQL/integration
Inserções diretas inválidas (nota 6, preço nulo no FIXO, intervalo invertido, prazo inválido, self-review) falham. Duas publicações simultâneas do mesmo par resultam em uma ativa. Atualizar descrição altera updated_at sem mexer em created_at. Não duplica nota/preço médio ao juntar ofertas e reviews. Banco novo migra e seed repetido não duplica catálogo.


---

# Arquivo: docs/tasks/BACKLOG.md

# Backlog — tracker local

Status inicial de todas as tarefas: TODO. Ao executar, atualizar para IN_PROGRESS/DONE/BLOCKED, com evidência e pendências. Não abrir issues remotas automaticamente.

| Tarefa | Depende de | Fatia / entrega | Evidência obrigatória |
|---|---|---|---|
| T00 | — | Inspecionar repo, fixar versões, scripts, Compose, env, migrations auth/domínio e seed catálogo; shell visual e tokens. | Banco saudável; migration em vazio; seed repetido; build do shell. |
| T01 | T00 | Cadastro/login/logout, conta privada e autorização base. | Sessão persiste; logout revoga; mutation sem sessão falha; senha não vaza. |
| T02 | T01 | Criar/editar/desativar perfil e renderizar URL pública com contatos. | Usuários A/B não editam um ao outro; perfil desativado vira 404. |
| T03 | T02 | CRUD e pausa/exclusão lógica de ofertas, formatos condicionais de preço/prazo. | Dados persistem; constraints inválidas falham; concorrência UNIQUE parcial. |
| T04 | T03 | Home/catálogo e busca real agrupada, filtros, paginação e ordenação. | Filtros na mesma oferta; acentos; hora vs projeto; zero resultados. |
| T05 | T04 | Comparação de até três resultados com estado local e URL. | Quarto recusado; mesmo prestador não duplica; anúncio pausado some com aviso. |
| T06 | T02 | Criar/editar/excluir avaliação e agregados públicos. | UNIQUE par e self-review em app/banco; edição/exclusão recalculam média. |
| T07 | T04 | Preço médio fixo por tipo com amostra e rótulo transparente. | 800/1000/1200 → 1000; outros modelos excluídos; n<3 não exibe número. |
| T08 | T05,T06,T07 | Seed demo opcional, estados completos, acessibilidade e polimento de todas as jornadas. | QA 375/768/1440; teclado; dados vazios/longos; sem placeholder morto. |
| T09 | T08 | Revisão de acesso/segurança, testes integrados e E2E, README operacional. | Todos os gates do ACCEPTANCE com resultados registrados. |
| T10 | T09 | Entrega final, arquivos/decisões atualizados, guia de execução e limitações. | Fresh install documentado; restart preserva dados; matriz RF completa. |

## Estratégia de execução
T00 é base técnica necessária; T01–T07 são fatias verticais, não agentes separados construindo frontend e backend sem contrato. Delegação opcional pode paralelizar T05/T06/T07 após suas dependências. Um integrador controla migrations, auth e tokens. Não editar mesmas migrations em paralelo. Cada tarefa referencia RF no PRD/Sxx na spec e acrescenta testes apenas relevantes.

## Registro a preencher pelo implementador
Para cada tarefa: status, arquivos alterados, RF/Sxx atendidos, comandos e resultado, riscos/bloqueios, próxima tarefa. Retomada de sessão lê esse registro antes de inventar novo plano.


---

# Arquivo: docs/ACCEPTANCE.md

# Plano de aceite e definição de pronto

## Gates automatizados
pnpm lint; pnpm typecheck; pnpm test; pnpm test:integration; pnpm test:e2e; pnpm build. Scripts devem existir e falhar quando algo relevante quebra. Não basta renomear comandos vazios. Testes de integração contra PostgreSQL de teste e E2E com base isolada. Se ambiente não suportar um gate, registrar não executado, razão e comando para o usuário; não reportar como passou.

## Cenários essenciais
| ID | Given / When / Then | RF |
|---|---|---|
| AC01 | Banco vazio → migrations + seed duas vezes → catálogo único e app funcional. | RF12 |
| AC02 | Visitante cadastra/entra/sai → páginas privadas e actions respeitam sessão real. | RF02 |
| AC03 | Conta A cria perfil PF → mantém capacidade de buscar/avaliar outros. | RF03 |
| AC04 | Conta B tenta editar perfil/oferta de A por payload/URL → sem mudança no banco. | RF04,05,12 |
| AC05 | Prestador publica preço/prazo em cada modelo → formatação e checks corretos. | RF06 |
| AC06 | Dois anúncios ativos concorrentes no mesmo par → só um ativo; erro legível. | RF05 |
| AC07 | Nome/título com acento → pesquisa com e sem acento encontra; paginação sem duplicação. | RF01,07 |
| AC08 | Mesmo perfil tem uma oferta barata e outra rápida → filtro combinado não usa duas ofertas para fabricar match. | RF07 |
| AC09 | Filtrar por prazo até 7 → intervalo 3–5 incluído, 3–9 excluído, 7+ e a combinar excluídos. | RF07 |
| AC10 | Comparar 3 → quarto recusado; recarregar preserva IDs e revalida dados; perfis distintos. | RF08 |
| AC11 | Usuário avalia terceiro → nota aparece; segunda avaliação não duplica; editar/deletar recalcula. | RF09,10 |
| AC12 | Dono tenta autoavaliar por action e SQL → ambos recusados. | RF10,12 |
| AC13 | FIXO 800/1000/1200 → média 1000 n3; 100/h, 1500+ e faixas não entram. | RF11 |
| AC14 | Dois prestadores elegíveis → média numérica ausente; mensagem de dados insuficientes. | RF11 |
| AC15 | Perfil desativado ou oferta excluída → ausentes de busca/estatística/comparação; preservados no painel. | RF04,05 |
| AC16 | E-mail de login difere do público → somente público sai no perfil; token/hash não saem em respostas/logs. | RF09,12 |
| AC17 | Reiniciar app e container sem apagar volume → contas/ofertas permanecem. | RF12 |
| AC18 | Catálogo vazio e perfil sem avaliações/foto → estados úteis, sem fake data no runtime. | RF01,09 |

## QA manual/visual
Home, busca filtrada, perfil, comparação, cadastro/login, edição de perfil e oferta em 375/768/1440px. Verificar contraste, foco, teclado, labels, mensagens de erro, loading, dados extensos, links reais, URLs perigosas rejeitadas, ausência de overflow. Sem texto placeholder, CTA sem ação, layout genérico com gradiente ou depoimentos inventados.

## Definition of Done
Todos os must-have integrados ao banco; código auth real; migrations e seeds versionados; checagem de dono em cada mutation; nenhum secret comitado; README operacional com passos exatos; evidências dos gates; dependências/lockfile registrados; documentação consistente com código. Qualquer gate não executado ou requisito parcial aparece como limitação explícita. Publicação em nuvem não compõe este aceite.


---

# Arquivo: docs/adr/0001-mvp-decisions.md

# ADR 0001 — MVP monolítico de descoberta
Status: aceito como baseline de implementação.

## Contexto
Modelo original cobria contratação/triagem/propostas. A entrevista definiu primeira versão semelhante a classificados, com cliente e prestador na mesma conta. Next/TS/PostgreSQL Docker são preferências explícitas do usuário.

## Decisão
Next.js monolítico modular. Conta auth + perfil prestador opcional. Catálogo central → ofertas próprias. Avaliação aberta com divulgação de contratação não verificada. Contato externo. Drizzle torna schema/migrations legíveis e Better Auth evita auth artesanal. Sem serviços adicionais obrigatórios.

## Consequências
Menor escopo, contratos de dados definidos, backend junto ao frontend. Não há garantia de contratação/reputação verificada. PJ só tem uma conta responsável. Estatística representa preços anunciados FIXO comparáveis, não estimativa automática de demanda. Recuperação/verificação email e moderação precisam ser endereçadas para lançamento público posterior.

## Evolução
Propostas, demandas, pagamentos e triagem só entram após nova especificação; não manter tabelas vazias antecipadas. Mudanças documentadas em novos ADRs com efeitos sobre testes e migrations.


---

# Arquivo: docs/SOURCES.md

# Fontes e limites
Consultadas em 06/10/2026 para orientar escolhas técnicas. As versões instaladas devem ser conferidas pelo implementador.

- Matt Pocock, repositório oficial: https://github.com/mattpocock/skills — instalação, setup, glossário, entrevista e decomposição; nomes podem mudar por versão.
- Next.js, Authentication: https://nextjs.org/docs/app/guides/authentication — biblioteca de auth e verificação no servidor.
- Next.js, Data Security: https://nextjs.org/docs/app/guides/data-security — DAL/server-only e validação/autorização de ações.
- shadcn/ui, Next.js: https://ui.shadcn.com/docs/installation/next — instalação e integração.
- Better Auth, adapter Drizzle: https://better-auth.com/docs/adapters/drizzle — integração e schema compatível.
- Drizzle, PostgreSQL: https://orm.drizzle.team/docs/get-started/postgresql-new — driver e migrations.

Fontes de produto: entrevista anexada na conversa; board “Meu primeiro board.csv” lido como contexto histórico; modelo “Modelo banco de dados.mwb.zip” convertido/revisado conceitualmente na conversa anterior. O novo DBML é redesenho de domínio, não conversão literal do Workbench. Sem necessidade de manter tabelas originais descartadas.

Não foi executada uma implementação ou validação do aplicativo nesta entrega. Este pacote contém especificações e guia de execução.

# Spec — MVP 3: selo de confiança, filtros de Oportunidades, Prestador VIP e Preço de mercado externo

Status: ready-for-agent
Decisões: docs/adr/0004-mvp3.md. Vocabulário: GLOSSARY.md. O MVP 2 (docs/tasks/mvp2/spec.md) continua valendo.
Prazo: tudo em produção até 12h30 de 25/11/2026 (Review da Sprint 4). Origem: card "MVP 3° versão" do Trello.

## Problem Statement

O Cliente que encontra um Prestador não tem um sinal rápido de que ele é confiável: precisa abrir as Avaliações e interpretar sozinho. O Prestador que procura trabalho vê todas as Oportunidades dos seus Tipos de serviço numa lista só, sem como separar as que cabem no seu preço, no seu prazo ou as que vieram de Convite. A plataforma não tem nenhuma forma de diferenciar Prestadores que queiram mais visibilidade, nem de medir se alguém pagaria por isso. E o Preço de referência mostra só o que o mercado da própria plataforma anuncia: com poucas Ofertas, o Cliente não tem uma segunda opinião de fora.

## Solution

- **Selo de confiança**: o Prestador que tem e-mail confirmado, ao menos uma Avaliação verificada e média de 4,0 ou mais nas verificadas ganha o selo automaticamente. O selo aparece no Perfil, na busca e nos Prestadores compatíveis, sempre explicando os critérios.
- **Filtros de Oportunidades**: no painel, o Prestador filtra as Oportunidades por texto, Tipo de serviço, orçamento mínimo, prazo máximo e situação (convidado, sem Proposta minha, já enviei), com o que o Projeto já tem. A Triagem do Cliente não muda.
- **Prestador VIP**: a plataforma marca alguns Prestadores como VIP. Eles ganham o selo VIP e podem aparecer no Destaque VIP, uma faixa identificada no topo da busca. Qualquer Prestador vê a página do VIP com os benefícios e pode registrar Interesse no VIP, sem ativação nem cobrança.
- **Preço de mercado externo**: uma coleta semanal com Firecrawl lê páginas públicas de preço e guarda, por Tipo de serviço, a faixa em reais de cada fonte, com link e data. O resultado da Triagem e o painel de Ofertas mostram esses preços ao lado do Preço de referência, sem misturar os dois.

## User Stories

### Selo de confiança
1. Como Cliente, quero ver um selo de confiança no Perfil do Prestador, para decidir mais rápido em quem confiar.
2. Como Cliente, quero ver o selo nos cards da busca, para priorizar Prestadores confiáveis sem abrir cada Perfil.
3. Como Cliente, quero ver o selo nos Prestadores compatíveis da Triagem e do Projeto, para escolher a quem mandar Convite.
4. Como Cliente, quero entender por que o Prestador tem o selo (os três critérios), para saber que não é um selo comprado.
5. Como Prestador, quero ganhar o selo automaticamente quando cumprir os critérios, sem pedir a ninguém.
6. Como Prestador, quero saber no meu painel quais critérios me faltam para o selo, para saber o que fazer.
7. Como Cliente, não quero ver o selo em quem tem só Avaliações antigas sem contratação verificada, para que o selo signifique contratação real.
8. Como Cliente, não quero ver o selo em quem tem média verificada abaixo de 4,0.
9. Como plataforma, quero que o selo desapareça sozinho se o Prestador deixar de cumprir um critério (por exemplo, nova Avaliação verificada baixa a média), sem nenhuma ação manual.

### Filtros de Oportunidades
10. Como Prestador, quero buscar Oportunidades por texto no título e na descrição, para achar Projetos do meu interesse.
11. Como Prestador, quero filtrar por Tipo de serviço entre aqueles em que tenho Oferta ativa.
12. Como Prestador, quero filtrar por orçamento a partir de um valor, para não perder tempo com Projetos abaixo do meu preço.
13. Como Prestador, quero continuar vendo Projetos com orçamento não informado mesmo com o filtro de orçamento, marcados como "orçamento não informado", para não perder Oportunidades.
14. Como Prestador, quero filtrar por prazo desejado de até N dias.
15. Como Prestador, quero filtrar as Oportunidades para as quais recebi Convite.
16. Como Prestador, quero filtrar as Oportunidades em que ainda não enviei Proposta, e separadamente as em que já enviei.
17. Como Prestador, quero combinar os filtros com a ordenação existente.
18. Como Prestador, quero que os filtros fiquem no endereço da página, para voltar ao mesmo recorte e compartilhar.
19. Como Prestador, quero ver quantas Oportunidades o filtro encontrou e limpar todos os filtros com um clique.
20. Como Prestador, quero uma mensagem clara quando nenhum Projeto atender aos filtros, com a opção de limpar.
21. Como Prestador, quero que valores inválidos nos filtros (texto no orçamento, prazo negativo) sejam ignorados com aviso, sem erro de página.

### Prestador VIP
22. Como Cliente, quero ver o selo VIP no Perfil e nos cards da busca dos Prestadores VIP.
23. Como Cliente, quero ver no topo da busca uma faixa "Destaque VIP", claramente identificada, com até três Prestadores VIP que atendem aos filtros que apliquei.
24. Como Cliente, não quero ver a faixa quando nenhum Prestador VIP atende aos meus filtros.
25. Como Cliente, quero que a Triagem e os Prestadores compatíveis não mudem de ordem por causa do VIP, para confiar que a compatibilidade é neutra.
26. Como Prestador, quero uma página do VIP no painel que explique os benefícios (selo VIP e Destaque VIP) e diga claramente que nesta versão não há assinatura nem cobrança.
27. Como Prestador, quero registrar Interesse no VIP com um botão, e ver depois que meu interesse foi registrado e quando.
28. Como Prestador, quero que clicar de novo no botão não duplique o registro.
29. Como Prestador VIP, quero ver na página que já sou VIP.
30. Como Cliente, não quero conseguir registrar Interesse no VIP (é só para Prestador).
31. Como equipe, quero que o seed demo marque alguns Prestadores como VIP, para a apresentação.

### Preço de mercado externo
32. Como Cliente, quero ver no resultado da Triagem, ao lado do Preço de referência, a faixa de preço de fora da plataforma para o Tipo de serviço, para ter uma segunda opinião.
33. Como Cliente, quero ver o nome da fonte, o link e a data da coleta de cada preço externo, para julgar se confio no número.
34. Como Cliente, quero uma mensagem honesta quando não houver preço externo para o Tipo de serviço.
35. Como Prestador, quero ver o preço externo no meu painel de Ofertas, para precificar as minhas.
36. Como plataforma, quero que o preço externo nunca entre no cálculo do Preço de referência.
37. Como plataforma, quero coletar os preços externos toda semana automaticamente.
38. Como plataforma, quero que uma fonte que falhar na coleta mantenha o último valor válido, mostrando a data antiga, em vez de sumir ou gravar lixo.
39. Como plataforma, quero descartar valores extraídos inválidos (não numéricos, zero, mínimo maior que máximo) e registrar a falha.
40. Como equipe, quero rodar a coleta à mão por um comando, para fazer a primeira carga antes da apresentação.
41. Como plataforma, quero que a rota da coleta agendada só aceite chamadas com o segredo do cron.

### Entrega
42. Como equipe, quero o CI no GitHub Actions rodando lint, tipos, testes unitários, de integração, e2e e build em cada PR para a main.
43. Como equipe, quero a demo de produção com Prestadores com selo, Prestadores VIP, Oportunidades variadas para os filtros e a primeira coleta de preços externos feita.

## Implementation Decisions

- **Selo de confiança é derivado**, como a Avaliação verificada: nenhuma coluna, nenhum painel de concessão. Uma única função de servidor no módulo de reputação calcula, por Prestador, os três critérios (e-mail confirmado do usuário dono do Perfil; contagem de Avaliações verificadas ≥ 1; média das verificadas ≥ 4,0) e se o selo vale. Ela entra como subconsulta nas mesmas consultas que já agregam reputação (Perfil, busca, compatíveis), sem consulta por linha. A média compara em decimal no banco, não em float no JavaScript.
- **Um componente de selo** com o texto "Selo de confiança" e um "por quê" acessível (popover ou detalhes) listando os critérios. O painel do Prestador mostra o checklist dos três critérios com o estado de cada um.
- **Filtros de Oportunidades** estendem a consulta existente de Oportunidades (Projetos ABERTOS nos Tipos em que o Prestador tem Oferta ativa) com parâmetros validados por zod: `q` (unaccent ILIKE em título e descrição), `tipo` (slug, restrito aos Tipos do Prestador), `orcamento_min` (decimal; casa quando o teto do orçamento ≥ valor; NAO_SEI sempre incluído e marcado), `prazo_ate` (inteiro 1–3650; Projeto sem prazo desejado só aparece sem esse filtro), `situacao` (`convidado` | `sem_proposta` | `enviada`). O Prestador vem sempre da sessão. Sem migration.
- **Prestador VIP**: nova coluna booleana `vip` (padrão falso) no Perfil do Prestador, alterada só por seed ou SQL da equipe; nenhuma ação do usuário escreve nela. Nova tabela de Interesse no VIP com no máximo um registro por Prestador (unique) e data; a ação de registrar é idempotente, exige sessão de Prestador com e-mail confirmado e usa o rate limit de mutações existente. RLS habilitada na tabela nova, como as demais (ver README).
- **Destaque VIP** na busca: só na primeira página, até três Prestadores VIP ativos que atendem aos mesmos filtros da busca, ordenados por nota e depois nome. A faixa é rotulada "Destaque VIP" e os Prestadores dela continuam podendo aparecer na lista normal. Triagem e compatíveis não leem a coluna `vip` para ordenar.
- **Página do VIP** no painel do Prestador, com benefícios, aviso "Nesta versão não há assinatura nem cobrança" e o botão "Tenho interesse".
- **Preço de mercado externo**: nova tabela com Tipo de serviço, nome da fonte, URL da fonte, valor mínimo e máximo (numeric), trecho de texto que sustenta o valor, data da coleta e situação da coleta. Cada coleta grava uma linha nova por fonte; a exibição usa a última linha válida de cada fonte. As fontes são uma lista versionada no código, por slug de Tipo de serviço (pesquisa em 24/11: Cronoshare, Hostinger, Nuvemshop e Sebrae PR cobrem landing-page, site-institucional, e-commerce, sistema-web e manutencao-web; api, backend e integracao-de-sistemas ficam sem fonte).
- **Coletor** num módulo server-only com uma interface pequena de cliente Firecrawl (scrape com formato JSON, schema `{ valor_min, valor_max, trecho }` e prompt pedindo a faixa em reais do serviço específico). A implementação real chama a API HTTP v2 do Firecrawl com `FIRECRAWL_API_KEY`; os testes usam um cliente falso. As fontes rodam em paralelo com tolerância a falha por fonte.
- **Agendamento** pelo Cron da Vercel, semanal (segunda, 09:00 UTC), numa rota GET que exige `Authorization: Bearer ${CRON_SECRET}`. Um script de pacote roda a mesma coleta à mão.
- **Exibição** do preço externo num componente único, reutilizado no resultado da Triagem e no painel de Ofertas: uma linha por fonte, "R$ min – R$ max · Fonte · coletado em dd/mm/aaaa", link externo com `rel="noopener noreferrer"`, e o texto "Preço fora da plataforma; não entra no Preço de referência". Sem fonte: "Ainda não há preço externo para este Tipo de serviço."
- **Migrations aditivas** (expand): colunas com padrão e tabelas novas, para o código atual da main continuar funcionando. Migrations e seed de catálogo rodam só no build de produção; previews usam o banco de produção e podem falhar com schema novo até o merge (README). Por isso a verificação de cada ticket é local, com Postgres próprio.
- **CI** em GitHub Actions, Linux, no `pull_request` para a main (tipos opened, synchronize, reopened, ready_for_review), jobs com `if: github.event.pull_request.draft == false`, `concurrency` com cancel-in-progress, cache do pnpm, `timeout-minutes` em todo job, serviço Postgres para integração e e2e. Repositório público: minutos grátis.

## Testing Decisions

- Bons testes verificam comportamento observável: o que a consulta ou a ação devolve para um usuário real no banco, e o que a tela mostra. Nada de snapshots nem de testar detalhes internos.
- **Integração (Vitest + Postgres de teste)** é o seam principal de cada feature, com o padrão de `tests/integration/reviews.test.ts` e `discovery.test.ts`:
  - Selo: Prestador sem verificada → sem selo; verificada nota 5 + e-mail confirmado → selo; e-mail não confirmado → sem selo; média 3,5 → sem selo; só Avaliações antigas → sem selo; agregados sem duplicação por joins.
  - Filtros: cada filtro isolado e combinados; orçamento NAO_SEI incluído; Tipo fora dos do Prestador ignorado; situação usa só o Prestador da sessão; entradas inválidas ignoradas.
  - VIP: Destaque respeita filtros e limite de 3; ninguém escreve `vip` por ação; Interesse idempotente; Cliente recusado.
  - Preço externo: coletor com cliente falso grava linhas válidas, descarta inválidas, mantém o último valor quando a fonte falha; a consulta de exibição devolve a última linha válida por fonte; a rota do cron recusa sem o segredo.
- **E2E (Playwright)**, um caminho feliz por feature, no padrão de `tests/e2e/triage.spec.ts`: selo visível no Perfil; filtro de Oportunidades pela URL; faixa Destaque VIP na busca e registro de interesse; preço externo no resultado da Triagem (dados do seed, sem chamar o Firecrawl).
- Localmente cada worker roda lint, tipos e os testes do que mudou; o conjunto completo e o build rodam no CI do PR.

## Out of Scope

- Cobrança, assinatura, gateway de pagamento, período de teste ou autoativação do VIP.
- Painel administrativo para marcar VIP ou conceder selo.
- Tecnologias, modalidade de trabalho e nível de experiência no Projeto (descartados em 24/11: o Cliente não sabe ou não precisa informar).
- Misturar preço externo no Preço de referência; preço externo na home ou na busca.
- Fontes de preço que exigem login ou JavaScript; fontes estrangeiras em outra moeda.
- Notificações sobre o selo ou sobre Oportunidades novas.

## Further Notes

- O Trello atribui os itens a membros da equipe (Firecrawl: Caio; selo: Erick; VIP: Rogério e Esdras; filtros: Messias). A implementação é toda neste repositório. Os filtros mudaram de critério depois da daily de 18/11; quem apresenta deve explicar.
- Passos do dono: criar a API key do Firecrawl e gravar `FIRECRAWL_API_KEY` e `CRON_SECRET` como variáveis sensíveis na Vercel (Production). Para rodar o seed demo e a primeira coleta contra a produção, a `DATABASE_URL` de produção precisa estar disponível no ambiente de quem roda, sem ir para o git.
- Deploy: autorizado pelo dono para a noite de 24/11, merge na main depois da verificação local e do CI.

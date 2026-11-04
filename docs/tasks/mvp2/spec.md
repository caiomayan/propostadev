# Spec — MVP 2: contas separadas, triagem de projetos e avaliações verificadas

Status: ready-for-agent
Decisões: docs/adr/0003-mvp2-contas-e-triagem.md. Vocabulário: GLOSSARY.md. Substitui S01 (contas) e S06 (avaliações) de docs/specs/MVP.md; o restante do MVP 1 continua valendo.
Prazo: tudo em produção até a noite de 03/11/2026 (Review da Sprint 3 em 04/11).

## Problem Statement

No MVP 1, quem precisa de um software tem que saber o nome técnico do serviço, procurar sozinho e adivinhar se o preço faz sentido. Não existe um jeito de descrever o que precisa e receber respostas de prestadores. Qualquer conta pode avaliar qualquer prestador, então a reputação não diz se a pessoa contratou de fato. Clientes e prestadores dividem a mesma experiência, o que deixa o painel confuso para os dois.

## Solution

Cada conta é Cliente ou Prestador desde o cadastro. O Cliente faz uma Triagem: descreve o Projeto num fluxo guiado e vê imediatamente o Preço de referência daquele Tipo de serviço e os Prestadores compatíveis, com os motivos da compatibilidade. Depois publica o Projeto, convida Prestadores e recebe Propostas. Elas aparecem lado a lado com o Preço de referência, e o Cliente pré-seleciona, recusa e aceita uma. O Aceite libera os contatos dos dois lados e habilita a Avaliação verificada. Tudo com uma identidade visual nova, login social e recuperação de senha.

## User Stories

### Contas e autenticação
1. Como visitante, quero escolher no cadastro se sou Cliente ou Prestador, para cair direto na experiência certa.
2. Como visitante, quero entender em uma frase o que cada tipo de conta faz antes de escolher.
3. Como visitante, quero entrar com GitHub ou Google, para não criar outra senha.
4. Como usuário que entrou pela primeira vez via GitHub/Google, quero escolher meu tipo de conta antes de usar o painel.
5. Como usuário, quero ver e ocultar a senha enquanto digito e saber se ela é forte o bastante.
6. Como usuário que esqueceu a senha, quero receber um link por e-mail para redefini-la.
7. Como usuário recém-cadastrado, quero confirmar meu e-mail sem ficar bloqueado de usar a plataforma.
8. Como usuário, quero mensagens de erro claras que não revelem se um e-mail existe.
9. Como Cliente, quero um painel focado nos meus Projetos e Propostas recebidas.
10. Como Prestador, quero um painel focado no meu Perfil, Ofertas, Oportunidades e Propostas enviadas.
11. Como Cliente, não quero ver opções de Perfil e Oferta que não se aplicam a mim.
12. Como Prestador, não quero ver opção de publicar Projeto.
13. Como usuário do MVP 1 com perfil de prestador, quero continuar como Prestador sem refazer nada.
14. Como usuário do MVP 1 sem perfil, quero continuar como Cliente.

### Triagem
15. Como visitante ou Cliente, quero iniciar uma Triagem a partir da home dizendo o que preciso.
16. Como Cliente sem conhecimento técnico, quero escolher meu objetivo em linguagem simples (por exemplo, "vender online") e receber sugestões de Tipo de serviço.
17. Como Cliente, quero escolher o Tipo de serviço diretamente se já sei o que é.
18. Como Cliente, quero informar orçamento como faixa, como teto ou como "ainda não sei".
19. Como Cliente, quero informar o prazo desejado em dias ou dizer que é flexível.
20. Como Cliente, quero descrever o Projeto com título e descrição.
21. Como Cliente, quero ver o Preço de referência do Tipo de serviço: média dos preços fixos, faixa anunciada e tamanho da amostra.
22. Como Cliente, quero saber se meu orçamento está abaixo, dentro ou acima da faixa anunciada.
23. Como Cliente, quero ver os Prestadores compatíveis ordenados de forma explicada (orçamento, prazo, reputação).
24. Como Cliente, quero ver em cada Prestador compatível os motivos ("Dentro do orçamento", "Prazo compatível", "3 avaliações verificadas").
25. Como visitante, quero ver o resultado da Triagem sem login e só precisar entrar para publicar.
26. Como visitante que entrou no meio da Triagem, quero não perder o que preenchi.
27. Como Cliente, quero publicar o Projeto para receber Propostas.
28. Como Cliente, quero convidar Prestadores compatíveis específicos para o meu Projeto.
29. Como Cliente, quero ver todos os meus Projetos e seus estados.
30. Como Cliente, quero cancelar um Projeto aberto que não faz mais sentido.
31. Como Cliente, quando a amostra for pequena, quero ser avisado de que não há dados suficientes, em vez de ver um número enganoso.

### Oportunidades e Propostas (Prestador)
32. Como Prestador, quero ver os Projetos abertos dos Tipos de serviço em que tenho Oferta ativa.
33. Como Prestador, quero ver primeiro os Projetos para os quais fui convidado.
34. Como Prestador, quero ver de cada Projeto o orçamento, o prazo, a descrição e o Preço de referência.
35. Como Prestador, quero enviar uma Proposta com valor, prazo e mensagem.
36. Como Prestador, quero editar minha Proposta enquanto o Projeto estiver aberto e ela não tiver sido recusada.
37. Como Prestador, quero retirar uma Proposta.
38. Como Prestador, quero ver o estado de todas as minhas Propostas (enviada, pré-selecionada, recusada, aceita, retirada).
39. Como Prestador com Proposta aceita, quero ver nome e e-mail do Cliente para combinar o trabalho.
40. Como Prestador, não quero enviar duas Propostas para o mesmo Projeto.
41. Como Prestador sem Perfil ativo, quero ser orientado a completá-lo antes de propor.

### Triagem de propostas (Cliente)
42. Como Cliente, quero ver as Propostas de um Projeto lado a lado, com valor, prazo, nota e avaliações verificadas do Prestador.
43. Como Cliente, quero ver cada valor posicionado em relação ao Preço de referência.
44. Como Cliente, quero ver cada prazo em relação ao meu prazo desejado.
45. Como Cliente, quero ordenar as Propostas por valor, prazo ou reputação.
46. Como Cliente, quero pré-selecionar Propostas e filtrar só as pré-selecionadas.
47. Como Cliente, quero recusar Propostas que não me interessam.
48. Como Cliente, quero aceitar uma Proposta com confirmação, sabendo que isso encerra o Projeto e recusa as demais.
49. Como Cliente, depois do Aceite, quero ver os contatos do Prestador escolhido.
50. Como Cliente, quero abrir o Perfil público do Prestador a partir da Proposta.

### Avaliações
51. Como Cliente com Proposta aceita, quero avaliar aquele Prestador.
52. Como Cliente, quero editar ou excluir minha Avaliação.
53. Como visitante, quero distinguir Avaliações verificadas das antigas sem verificação.
54. Como Prestador, quero que só quem me contratou pela plataforma possa me avaliar daqui em diante.
55. Como visitante, quero ver no Perfil a nota média e quantas Avaliações são verificadas.

### Experiência geral
56. Como qualquer pessoa, quero uma interface moderna, consistente e bonita em celular e desktop.
57. Como avaliador da disciplina, quero dados de demonstração realistas cobrindo todos os estados.
58. Como usuário de teclado ou leitor de tela, quero conseguir completar Triagem, Proposta e Aceite.

## Implementation Decisions

### Contas
- O tipo de conta é um campo adicional do usuário no Better Auth (`CLIENTE` | `PRESTADOR`), nulo apenas para quem ainda não escolheu (entrada via OAuth). O schema de auth é regenerado pela CLI oficial, nunca editado à mão.
- A escolha é feita no cadastro (cartões de rádio) ou em `/boas-vindas`, depois do primeiro OAuth. É imutável: o servidor recusa trocar um tipo já definido.
- Migration de dados: usuários com perfil_prestador → PRESTADOR; demais → CLIENTE.
- Guarda central no servidor: helpers de sessão exigem um tipo de conta. Rotas e Server Actions de Cliente recusam Prestador e vice-versa. Sem tipo definido, qualquer rota privada redireciona para `/boas-vindas`.
- Painel por tipo. Cliente: Projetos, Nova triagem, Conta. Prestador: Perfil, Ofertas, Oportunidades, Propostas, Conta.
- OAuth GitHub/Google ativa só se as variáveis existirem; sem elas, os botões não aparecem. E-mail por SMTP (nodemailer) ativa recuperação e verificação; sem SMTP, a recuperação não é oferecida e, em desenvolvimento, o link vai para o console. Com SMTP ativo, a confirmação de e-mail é obrigatória (decisão do dono em 03/11/2026, substitui o aviso não bloqueante): a pessoa entra, mas toda rota privada leva a `/confirmar-email` e toda Server Action de domínio recusa até o código de 6 dígitos ser confirmado. As páginas públicas continuam abertas. Quem entra com provedor que confirma o e-mail não passa por essa tela. Sem SMTP a exigência não vale, porque ninguém receberia o código.

### Domínio novo (tabelas em português, como no MVP 1)
- **projeto**: id uuid, cliente_id (usuário CLIENTE), tipo_servico_id, titulo 5–120, descricao 30–2.000 (o rascunho da Triagem vive na URL; 2.000 mantém a URL abaixo do limite da plataforma mesmo com acentos), orcamento_tipo (`FAIXA` | `ATE` | `NAO_SEI`), orcamento_min/orcamento_max decimais coerentes com o tipo (FAIXA: ambos, max >= min; ATE: só max; NAO_SEI: nenhum), prazo_desejado_dias 1–3.650 ou nulo (flexível), status (`ABERTO` | `ENCERRADO` | `CANCELADO`), proposta_aceita_id nulo, timestamps. Checks no banco.
- **convite**: projeto_id + prestador_id únicos, criado_em. Só para Projeto ABERTO e Prestador compatível. Limite de 10 por Projeto.
- **proposta**: id, projeto_id, prestador_id, valor decimal > 0 até 99.999.999,99, prazo_dias 1–3.650, mensagem 30–3.000, status (`ENVIADA` | `PRE_SELECIONADA` | `RECUSADA` | `ACEITA` | `RETIRADA`), timestamps. Uma por par projeto/prestador (UNIQUE). No máximo uma ACEITA por projeto (índice único parcial).
- **Transições**: o Prestador edita e retira enquanto ENVIADA/PRE_SELECIONADA e Projeto ABERTO. O Cliente pré-seleciona, desmarca, recusa e aceita apenas no próprio Projeto ABERTO. O Aceite é uma transação: a proposta vira ACEITA, as demais ativas viram RECUSADA, o Projeto vira ENCERRADO com proposta_aceita_id. Concorrência é resolvida pelo índice e por um update condicional. O cancelamento leva o Projeto a CANCELADO, e as Propostas ficam somente leitura.
- **Visibilidade**: Projetos ABERTOS aparecem para Prestadores com Perfil ativo e Oferta ativa no mesmo Tipo de serviço (Oportunidades), com os convidados primeiro. O Cliente aparece só pelo primeiro nome. O e-mail do Cliente só é visível ao Prestador da Proposta ACEITA. Os contatos públicos do Prestador continuam públicos.

### Preço de referência e compatibilidade (módulo de triagem, consultas puras)
- `precoReferencia(tipoServicoId)` → { mediaFixos (regra S07: FIXO, ≥ 3 prestadores distintos), faixa { min, max } sobre ofertas ativas com preço por projeto (FIXO, A_PARTIR_DE pelo mínimo, INTERVALO pelos dois extremos; exclui POR_HORA e SOB_CONSULTA), n de prestadores distintos na faixa; faixa só com n ≥ 3, senão "dados insuficientes" }.
- `posicaoOrcamento(orcamento, faixa)` → `ABAIXO` | `DENTRO` | `ACIMA` | `INDEFINIDO`; reutilizado para posicionar o valor de cada Proposta.
- `prestadoresCompativeis(projetoOuRascunho)`: perfis ativos com Oferta ativa no Tipo de serviço. Cada item traz motivos booleanos: cabeOrcamento (preço mínimo da oferta ≤ teto do orçamento; SOB_CONSULTA = desconhecido), cabePrazo (prazo mínimo da oferta ≤ prazo desejado), além de nota média, total de avaliações e total de verificadas. Ordem: cabeOrcamento desc, cabePrazo desc, verificadas desc, nota desc, nome, id. Até 12.
- Sugestões por objetivo: um mapeamento versionado no seed, de objetivo em linguagem simples para Tipos de serviço (por exemplo, "Vender online" → E-commerce). Não usa IA.
- O rascunho da Triagem vive na URL (query string validada no servidor), o que permite ver o resultado sem login e voltar após entrar.

### Avaliações
- A criação exige a sessão de um CLIENTE com Proposta ACEITA daquele Prestador, verificada no servidor e no banco (trigger). "Verificada" é derivada da existência dessa Proposta ACEITA. Avaliações do MVP 1 permanecem e aparecem como "Avaliação anterior, sem contratação verificada".
- O Perfil mostra a média geral e a contagem de verificadas ("4,5/5 · 6 avaliações · 4 verificadas"; sem nenhuma, "nenhuma verificada"). O texto "sem contratação verificada" vale só para as antigas. A mesma linha aparece na busca, na comparação e nos cartões de Proposta; na Triagem as verificadas são um motivo ("3 avaliações verificadas").
- Editar e excluir valem para o autor de qualquer Avaliação própria, inclusive as antigas e inclusive de conta Prestador (que herdou Avaliações do MVP 1); a exigência de Aceite vale só para criar (trigger BEFORE INSERT da migration 0005). Os agregados usam EXISTS, não JOIN, para que dois Aceites do mesmo Cliente não dupliquem a Avaliação.

### Infra e visual
- Produção: Vercel (projeto `propostadev`, já ligado ao GitHub) + Supabase Postgres. O app usa o pooler com SSL e as migrations rodam pela conexão de sessão/direta. As migrations Drizzle são aplicadas antes do deploy. `unaccent` é verificado no schema de extensões do Supabase.
- Nova identidade visual definida no ticket de fundação visual (tokens, tipografia, componentes base). DESIGN.md e docs/DESIGN-SYSTEM.md são reescritos. Cada ticket aplica a identidade nas telas que toca.
- Seed de demonstração idempotente: prestadores em vários tipos, Clientes, Projetos em todos os estados, Propostas em todos os estados e Avaliações verificadas e antigas. As contas demo estão documentadas no README.

## Testing Decisions

- Bons testes verificam comportamento observável pelas bordas públicas (Server Actions, consultas de módulo, páginas), não detalhes internos.
- **Seam principal**: as funções de módulo (actions e queries) contra Postgres real de teste, como já fazem tests/integration/domain.test.ts e discovery.test.ts. Cobrem: transições de Proposta (incluindo Aceite concorrente), autorização por tipo de conta e por dono, Preço de referência (exemplos numéricos), ordem dos Prestadores compatíveis, regra de Avaliação verificada e checks do banco.
- **Unidade** para validação pura (zod) de Projeto, Proposta e orçamento, como em tests/unit/domain-validation.test.ts.
- **E2E (Playwright)** para as duas jornadas principais: Cliente (Triagem → publicar → receber Proposta → aceitar → avaliar) e Prestador (Oportunidades → propor → ver aceite). Também o cadastro com tipo de conta. A prior art está em tests/e2e/private.spec.ts.
- Todo ticket termina com lint, typecheck, testes e verificação no browser (console e rede limpos).

## Out of Scope

Pagamentos, taxas, contratos, chat ou mensagens entre as partes, notificações por e-mail de Propostas, upload de arquivos, painel administrativo, moderação, troca de tipo de conta, contas de equipe, recomendação por IA, verificação documental, Clerk.

## Further Notes

- Ordem de corte se o prazo apertar: (1) Convites, (2) e-mail transacional, (3) OAuth Google. O núcleo intocável é: tipo de conta, Triagem com Preço de referência e compatíveis, Propostas com Aceite e Avaliação verificada.
- O board da equipe menciona Clerk; a decisão por Better Auth está no ADR 0003.

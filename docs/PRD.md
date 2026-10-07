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

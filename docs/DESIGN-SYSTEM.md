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

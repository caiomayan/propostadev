---
name: Proposta.dev
description: Diretório editorial neutro para descobrir, comparar e contatar prestadores.
colors:
  background: "#fafaf9"
  card: "#fff"
  foreground: "#18181b"
  muted: "#f4f4f5"
  muted-foreground: "#52525b"
  border: "#e4e4e7"
  primary: "#18181b"
  primary-foreground: "#fff"
  ring: "#52525b"
  destructive: "#b91c1c"
  success: "#166534"
typography:
  headline:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "36px"
    fontWeight: 600
    lineHeight: 1.22
    letterSpacing: "-0.03em"
  section-title:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "18px"
    fontWeight: 600
  body:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "14px"
    fontWeight: 500
rounded:
  label: "4px"
  control: "6px"
  surface: "8px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "48px"
  spacious: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 18px"
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 18px"
  field:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  panel:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.surface}"
    padding: "24px"
  domain-label:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.label}"
    padding: "3px 8px"
---

# Design System: Proposta.dev

## Overview

**Creative North Star: "Operate — diretório editorial neutro"**

O sistema construído organiza identidade, oferta e ação com texto legível, divisórias e uma paleta neutra. A busca e os dados do prestador conduzem a leitura; o produto não usa uma composição de agência como identidade. A marca é um wordmark tipográfico, com `.dev` em contraste secundário.

Este registro descreve o código atual em `src/app/globals.css`, `src/app/buscar/public.css` e componentes compartilhados. `PRODUCT.md` fornece os compromissos duráveis de português brasileiro, sobriedade e acesso por teclado; `docs/DESIGN-SYSTEM.md` continua sendo a autoridade de apresentação do pacote. Não há comp visual aprovada separada: a referência desta implementação é o brief baseado nos documentos e no código.

**Key Characteristics:**
- Paleta neutra com cores semânticas pontuais.
- Hierarquia compacta, metadados próximos à informação principal.
- Resultados em linhas, comparação em tabela e formulários em seções.
- Bordas e alinhamento como separadores; elevação reservada a elementos sobrepostos.

## Colors

A ação principal compartilha o tom escuro do texto; a cor não diferencia categorias de serviços.

### Primary

- **Grafite principal** (`primary`, `foreground`): texto, marca, divisórias de grupos de catálogo e CTA preenchido.
- **Branco de contraste** (`primary-foreground`): texto sobre o CTA escuro.

### Neutral

- **Papel neutro** (`background`): fundo geral.
- **Branco de superfície** (`card`): campos, painéis e header.
- **Cinza suave** (`muted`): convite ao prestador, avatar sem foto e estados secundários.
- **Cinza de metadados** (`muted-foreground`): descrição, localização, experiência e `.dev`.
- **Cinza de divisória** (`border`): listas, campos, tabelas e contornos.
- **Cinza de foco** (`ring`): indicação de foco.

Erros e ações destrutivas usam `destructive`; confirmações usam `success`. Esses papéis semânticos não constituem uma segunda identidade cromática.

**The Semantic Color Rule.** Cor semântica comunica estado; categorias compartilham a paleta neutra.

## Typography

A fonte observada é Arial, Helvetica, sans-serif, sem carregamento externo. É o estado atual do build, não uma nova escolha de fonte display para futuras telas. Não há fonte display ou mono distinta.

### Hierarchy

- **Headline:** título principal conforme frontmatter; passa a 30px até 768px. Autenticação usa 28px.
- **Section title:** seções de catálogo e conteúdo; contagem de busca e nome em resultado usam o título compacto de 18px.
- **Title:** subtítulos e identidade; o título de oferta em resultado usa 17px.
- **Body:** parágrafos gerais; metadados e descrições de resultado usam 14px. A descrição de perfil preserva quebras de linha e usa entrelinha 1.75.
- **Label:** controles e labels persistentes. Campos preservam 16px no mobile.

O wordmark usa 23px, peso 600 e tracking compacto. Rótulos de serviço e tipo permanecem como informação de domínio; não são um padrão de kicker decorativo para headings.

**The Information Hierarchy Rule.** Título, metadados e ação têm papéis separados; não acrescentar uma linha decorativa para anunciar cada heading.

## Layout

O contêiner público tem largura máxima de 1200px, centralizado, com gutters de 24px. Até 768px, os gutters são 16px. O header ocupa ao menos 80px em desktop e 72px em mobile; a navegação quebra para uma segunda linha no mobile. O build usa links visíveis com quebra de linha, não um menu mobile oculto.

A home limita seu bloco inicial a 800px, com título até 650px e parágrafo até 630px. O catálogo tem três colunas e vira uma coluna até 768px. Explicações em duas colunas e convites horizontais empilham na mesma faixa. Seções usam 48px de padding vertical em desktop e 32px em mobile.

A busca separa filtros de 240px e conteúdo com gap de 32px. Os resultados têm três áreas: identidade, oferta e ação. Até 1100px, identidade e oferta ficam numa coluna e ações numa coluna de 180px; até 767px, todas empilham e as ações podem quebrar em linha. Abaixo de 768px, filtros laterais dão lugar a um botão que abre Sheet à direita, limitado a 400px e com scroll próprio.

A tabela de comparação mantém largura mínima de 650px e scroll horizontal dentro do contêiner. Formulários usam duas colunas com gap de 20px e passam a uma coluna até 768px. Painéis usam 24px de padding, reduzido a 20px no mobile. A diferença entre os limites de 767px e 768px vem das media queries existentes; não é uma nova escala de breakpoints.

## Elevation & Depth

O conteúdo usa superfícies claras, contornos e divisórias. A bandeja de comparação possui sombra suave (`0 4px 16px #18181b0d`) para se distinguir enquanto acompanha a rolagem. O Sheet aplica backdrop escuro e a elevação do componente shadcn. Primitivos shadcn também carregam sombras discretas de botão/input: o build não é estritamente sem sombras.

**The Content Plane Rule.** Linhas de resultados permanecem no plano da página; a bandeja e o Sheet podem se sobrepor ao conteúdo.

## Shapes

Controles usam cantos discretos de 6px; painéis, avatar de iniciais e bandeja usam 8px. Labels neutros usam 4px. Divisórias são de 1px; cabeçalhos de grupos de catálogo usam linha de 2px. A forma do avatar é quadrada com cantos arredondados, não circular.

## Components

### Buttons

CTA principal escuro com texto branco, altura mínima de 44px, label de 14px, peso 500 e padding conforme frontmatter. A variante secundária é branca com contorno neutro. Hover da composição `.button` reduz opacidade para .88; foco global usa outline de 2px com offset de 3px. Botão desabilitado perde opacidade e apresenta estado de espera.

Os componentes shadcn mantêm suas variantes e focus ring locais. Nas composições existentes, a classe `.button` complementa essas variantes; não assumir que todo Button isolado tem os mesmos 44px. A variante destrutiva deve acompanhar uma ação destrutiva real.

### Labels and filters

Labels neutros mostram informações de domínio e filtros ativos. Não são pílulas promocionais. Filtros possuem labels persistentes, seletor e campos de valor lado a lado quando houver espaço; erros permanecem próximos à interação.

### Cards / Containers

Painéis brancos têm borda neutra e canto de superfície. Resultados de busca são linhas divididas por borda inferior, com 28px de padding vertical. A descrição de resultado limita a exibição a três linhas; perfil preserva o texto completo. Vazio usa contorno tracejado, mensagem e ação contextual.

### Inputs / Fields

Campo com contorno neutro, canto de controle e altura mínima de 44px na composição global. Label e ajuda permanecem fora do placeholder. Textarea tem altura mínima de 130px e resize vertical. Foco é visível; erros e confirmações usam texto semântico. Primitivos Input têm focus ring próprio e sombra discreta.

### Navigation

Marca à esquerda, links centrais e conta à direita. Links usam underline no hover. Em mobile, o header quebra e mantém navegação textual visível. O link “Pular para o conteúdo” aparece ao receber foco. O painel privado usa navegação horizontal com quebra de linha e divisória.

### Comparison

Bandeja sticky exibe contagem, “Ver comparação” e “Limpar” apenas com seleção em busca ou perfil de prestador. Sua posição é 16px acima do fundo em desktop e 8px em mobile. A comparação usa tabela com cabeçalhos claros e remoção por prestador, até três seleções. Não inserir a bandeja na home, autenticação ou painel.

### Filter Sheet

Painel à direita com padding de 24px, fechamento explícito e título. A composição de filtro limita a duração de transição a 180ms; `prefers-reduced-motion` desativa transições e animações globalmente. O backdrop efetivo é o do Sheet shadcn; o CSS de dialog nativo não é a aparência deste componente.

## Do's and Don'ts

### Do:

- **Do** preservar a paleta neutra, labels persistentes e foco visível.
- **Do** organizar identidade, oferta e ação em linhas legíveis que empilham no mobile.
- **Do** usar rótulos de serviço e tipo somente quando acrescentam informação de domínio.
- **Do** limitar o scroll horizontal ao contêiner da comparação.
- **Do** manter contato e negociação com texto direto em português brasileiro.

### Don't:

- **Don't** adicionar kickers decorativos acima dos títulos.
- **Don't** criar cores de categoria, gradientes, glow ou glassmorphism para esta identidade.
- **Don't** transformar resultados em uma grade de cartões promocionais ou inventar métricas.
- **Don't** estender a bandeja de comparação para rotas fora de busca e perfil.
- **Don't** tratar dimensões e sombras dos primitivos shadcn como substitutas automáticas das composições existentes.

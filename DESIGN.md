---
name: Proposta.dev
description: Diretório de desenvolvedores com identidade "régua de preço": papel esverdeado, tinta verde-floresta e um único destaque limão.
colors:
  background: "#f1f3ec"
  card: "#fafbf6"
  foreground: "#10231a"
  muted: "#e4e8dc"
  muted-foreground: "#46574d"
  border: "#c9d1c0"
  primary: "#0f3d2e"
  primary-foreground: "#f1f3ec"
  accent-fill: "#d4f25a"
  accent-ink: "#10231a"
  destructive: "#a8261c"
  success: "#17653a"
  dark-background: "#0b1410"
  dark-card: "#121e18"
  dark-foreground: "#e9efe3"
  dark-muted: "#1a2a21"
  dark-muted-foreground: "#a0b3a6"
  dark-border: "#2c3f34"
  dark-primary: "#d4f25a"
  dark-destructive: "#ff8f84"
  dark-success: "#7fdc9f"
typography:
  display:
    fontFamily: "Bricolage Grotesque (next/font/google), Trebuchet MS, sans-serif"
    fontWeight: 700
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Figtree (next/font/google), system-ui, sans-serif"
    fontSize: "16px"
    lineHeight: 1.6
rounded:
  control: "10px"
  surface: "18px"
  pill: "999px"
---

# Design System: Proposta.dev

Fonte de verdade da apresentação do MVP 2 (ADR 0003, item 7). Substitui o "diretório editorial sóbrio". Detalhes de uso em `docs/DESIGN-SYSTEM.md`; os tokens vivem em `src/app/globals.css`.

## Overview

O produto responde a uma pergunta: "quanto isso costuma custar e quem faz?". A identidade parte disso: **a régua de preço**. A marca é uma barra com a faixa central destacada em limão; a mesma faixa aparece como ilustração na home e como cor de destaque (avatar, nota, convite). Papel esverdeado, tinta verde-floresta, tipografia grande e firme, superfícies separadas por degrau de tom em vez de linhas.

**Direção escolhida (design-taste-frontend):** "Type and nothing else" adaptada a um app: a primeira tela é título enorme em Bricolage Grotesque, uma frase de apoio e a ação; a única ilustração é a régua. Descartadas "Dressed as something else" e "The printed annual" por não carregarem a ideia de preço/faixa.

## Colors

Uma base, uma tinta, um destaque. Tokens claro e escuro (seguem `prefers-color-scheme`; sem seletor manual).

- **Papel** (`background`) e **Superfície** (`card`): degrau de tom, sem borda.
- **Tinta** (`foreground`) para texto corrido; `muted-foreground` só para metadados.
- **Primary**: verde-floresta no claro (botão, cartão de destaque, rodapé); no escuro vira limão com texto escuro.
- **Accent-fill** limão: avatar, nota, faixa da régua, convite a prestadores, botão `.accent`. Nunca como cor de texto sobre papel claro.
- `destructive` e `success` só para erro e confirmação.

**Regra da faixa única.** Limão é o único destaque; sem cores por categoria, gradientes ou brilho.

## Typography

Duas famílias via `next/font/google` (self-hosted no build): **Bricolage Grotesque** para marca, títulos e preços; **Figtree** para o resto. Títulos 700 com tracking negativo; h1 fluido de 32px (telas internas) a 76px (home). Corpo 16px/1.6, metadados 14–15px.

## Elevation

Sem sombras em repouso. Só flutuam a bandeja de comparação e o Sheet.

## Shapes

Botões e etiquetas em pílula (999px). Superfícies 18px. Campos 10px com borda de 1.5px (mantêm contorno por usabilidade). Avatar circular com iniciais em limão.

## Components

Compartilhados e reutilizados pelos próximos tickets (triagem, propostas, painéis):

- `Wordmark` / `BrandMark` (`src/components/wordmark.tsx`).
- `SiteHeader`, `SiteFooter` (shell; footer em verde-floresta).
- `Button` (`ui/button`): default, outline, secondary, ghost, destructive; 44px. Classes `.button`, `.button.secondary`, `.button.accent`, `.button.danger` seguem o mesmo visual.
- `Card` (`ui/card`): `tone` default | muted | accent | brand. Equivalente em classe: `.panel` / `.panel.tone`.
- `Badge`, `Input`, `Textarea`, `Skeleton`, `Sheet` restilizados pelos tokens.
- `PriceRuler` (`components/price-ruler.tsx`): sem props é a ilustração decorativa da home (sem dados); com `data` mostra a faixa anunciada em limão, a média dos preços fixos e o orçamento do Cliente (ou o valor de uma Proposta, com `sujeito: "valor"`) na mesma escala, sempre com os valores também como texto na legenda. Usada na Triagem, no Projeto, nas Oportunidades e no formulário de Proposta.
- Slot da Triagem na home: `.triage-slot[data-slot="triagem"]` traz a entrada "O que você precisa?" (atalhos de objetivo e "Começar a Triagem"); a busca virou o link secundário "Buscar prestadores".
- Triagem, Projeto, Oportunidades e Propostas: `src/app/triagem/triagem.css` (`.triage-card`, `.chip`, `.status`, `.project-row`, `.data-ruler`, `.compatible-card`, `.confirm`). Selo "Convite" é um `.chip` limão; contadores de Propostas são `.chip.neutral`.
- Busca, perfil e comparação: `.provider-result`, `.price-statistic`, tabela e bandeja de comparação em `src/app/buscar/public.css`.

## Do's and Don'ts

### Do
- Ler cores só de tokens; nunca hex em componentes.
- Mostrar preço em destaque tipográfico, sempre com unidade (R$/hora, por projeto).
- Foco visível (outline 3px `--ring`), alvos de 44px, contraste AA nos dois temas.
- Respeitar `prefers-reduced-motion` (transições utilitárias de 150ms).

### Don't
- Gradientes, glow, glassmorphism, emojis como ícone, métricas inventadas.
- Limão como texto sobre fundo claro.
- Estender a bandeja de comparação além de busca e perfil.
- Criar variantes de botão ou cor para telas isoladas; evolua o token.

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
  control: "12px"
  surface: "20px"
  field: "32px"
  pill: "999px"
---

# Design System: Proposta.dev

Fonte de verdade da apresentação do MVP 2 (ADR 0003, item 7). Substitui o "diretório editorial sóbrio". Detalhes de uso em `docs/DESIGN-SYSTEM.md`; os tokens vivem em `src/app/globals.css`.

## Overview

O produto responde a uma pergunta: "quanto isso costuma custar e quem faz?". A identidade parte disso: **a régua de preço**. A marca é uma barra com a faixa central destacada em limão; a mesma faixa aparece como ilustração na home e como cor de destaque (avatar, nota, convite). Papel esverdeado, tinta verde-floresta, tipografia grande e firme, superfícies separadas por degrau de tom em vez de linhas.

**Direção (design-taste-frontend):** a composição de "Loud and flat", com a paleta e a tipografia da marca mantidas: cor chapada em campos inteiros, título enorme e peso 800. A paleta e a fonte sorteadas foram descartadas porque seriam troca de marca, e a marca foi aprovada.

**A ideia:** na Proposta.dev, a pergunta "quanto custa?" vira uma régua real que a pessoa arrasta. A primeira tela é o produto funcionando: o visitante escolhe um serviço, arrasta o orçamento e vê quantos prestadores começam naquele valor, com os preços anunciados de verdade. Cada traço na régua é um prestador.

## Colors

Uma base, uma tinta, um destaque. Tokens claro e escuro (seguem `prefers-color-scheme`; sem seletor manual).

- **Papel** (`background`) e **Superfície** (`card`): degrau de tom, sem borda.
- **Tinta** (`foreground`) para texto corrido; `muted-foreground` só para metadados.
- **Primary**: verde-floresta no claro (botão); no escuro vira limão com texto escuro.
- **Campos** (`--forest`, `--lime`): cor chapada de bloco inteiro, que mantém o sentido nos dois temas. As classes `.on-forest` e `.on-lime` redefinem os tokens de texto dentro do bloco; régua, botões e selos acompanham sem regra própria.
- **Accent-fill** limão: avatar, nota, faixa da régua, convite a prestadores, botão `.accent`. Nunca como cor de texto sobre papel claro.
- `destructive` e `success` só para erro e confirmação.

**Regra da faixa única.** Limão é o único destaque; sem cores por categoria, gradientes ou brilho.

## Typography

Duas famílias via `next/font/google` (self-hosted no build): **Bricolage Grotesque** para marca, títulos e preços; **Figtree** para o resto. Títulos 800 com tracking negativo; a Bricolage carrega os eixos `opsz` e `wdth`, e títulos muito grandes usam `font-stretch` de 90–94%. h1 fluido de 36px a 60px nas telas internas e até 112px na home. Corpo 16px/1.6, metadados 14–15px.

## Elevation

Sem sombras em repouso. Só flutuam a bandeja de comparação e o Sheet.

## Motion

Tudo em `src/app/motion.css` e `src/components/motion-layer.tsx`, sem biblioteca. Tokens: `--ease-out`, `--ease-expo`, `--ease-in-out`, `--t-press`, `--t-hover`, `--t-ui`, `--t-reveal`.

- **Regra da casa:** o estado final é o estado sem animação. Tudo que esconde ou desloca algo fica em `prefers-reduced-motion: no-preference`, e sem JavaScript nada fica escondido.
- **Assinatura:** a régua abre a faixa, depois marca a média e, por último, o valor de quem está olhando.
- **Entrada de rota:** `app/template.tsx` e `app/painel/template.tsx` remontam `.route`, e o conteúdo sobe em ordem de leitura.
- **Revelação por rolagem:** o `MotionLayer` marca com `data-rv` só o que está abaixo da dobra e usa seletores, sem marcação nas telas. Dentro de um `<details>` fechado, a régua espera até ele abrir.
- **Figuras:** `RollingFigure` faz os dígitos rolarem só com CSS; o valor real fica para leitores de tela.
- **Barra de navegação:** liga no clique em link interno e encerra quando a rota chega.
- **Jornada da home:** quadro parado e textos passando; no celular, cada texto mostra o próprio quadro.

Não use `loading.tsx` em rotas com `notFound()`: o fallback começa o streaming antes e a resposta sai 200 em vez de 404, o que quebra a regra de autorização do painel.

## Shapes

Botões e etiquetas em pílula (999px). Superfícies 20px, campos de cor 32px. Inputs 12px com borda de 1.5px (mantêm contorno por usabilidade). Avatar circular com iniciais em limão.

## Components

Compartilhados e reutilizados pelos próximos tickets (triagem, propostas, painéis):

- `Wordmark` / `BrandMark` (`src/components/wordmark.tsx`).
- `SiteHeader`, `SiteFooter` (shell; footer em verde-floresta).
- `Button` (`ui/button`): default, outline, secondary, ghost, destructive; 44px. Classes `.button`, `.button.secondary`, `.button.accent`, `.button.danger` seguem o mesmo visual.
- `Card` (`ui/card`): `tone` default | muted | accent | brand. Equivalente em classe: `.panel` / `.panel.tone`.
- `Badge`, `Input`, `Textarea`, `Skeleton`, `Sheet` restilizados pelos tokens.
- `PriceLab` e `JourneyStory` (`components/home/`): a régua arrastável e a jornada por rolagem da home. Dados de `getMarket` (`modules/triage/market.ts`), com cache de 5 minutos.
- Confirmação de e-mail (`components/auth/email-verification-notice.tsx`): um input real desenhado como seis casas, com envio automático no sexto dígito, tremida no código errado e onda limão no acerto. Não bloqueia o uso e aparece no início do painel.
- `AuthShell` (`components/auth/auth-shell.tsx`), `PanelLinks` (`components/panel-nav.tsx`), `SiteNav` e `RollingFigure`.
- `PriceRuler` (`components/price-ruler.tsx`): sem props é a ilustração decorativa dos estados vazios (sem dados); com `data` mostra a faixa anunciada em limão, a média dos preços fixos e o orçamento do Cliente na mesma escala (um valor único, como uma Proposta ou o preço de uma Oferta, vira ponto), sempre com os valores também como texto na legenda. Usada na Triagem (ao vivo, enquanto a pessoa digita o orçamento), no Projeto, nas Oportunidades e no formulário de Proposta.
- Slot da Triagem na home: `.triage-slot[data-slot="triagem"]` em campo limão, com os atalhos de objetivo e "Começar a Triagem". A busca é o link secundário "Buscar prestadores".
- Triagem, Projeto, Oportunidades e Propostas: `src/app/triagem/triagem.css` (`.triage-card`, `.chip`, `.status`, `.project-row`, `.data-ruler`, `.compatible-card`, `.confirm`). Selo "Convite" é um `.chip` limão; contadores de Propostas são `.chip.neutral`.
- Busca, perfil e comparação: `.provider-result`, `.price-statistic`, tabela e bandeja de comparação em `src/app/buscar/public.css`.

## Do's and Don'ts

### Do
- Ler cores só de tokens; nunca hex em componentes. Exceção: marcas de terceiros, como o "G" do Google e o botão neutro exigido por ele.
- Usar marcas de terceiros só por `components/brand-icons.tsx`: `simple-icons` para os traçados oficiais; lucide para ícones genéricos. O LinkedIn saiu do pacote, então o traçado oficial fica no próprio arquivo.
- Mostrar preço em destaque tipográfico, sempre com unidade (R$/hora, por projeto).
- Foco visível (outline 3px `--ring`), alvos de 44px, contraste AA nos dois temas.
- Respeitar `prefers-reduced-motion`: a página reduzida é a página pronta.

### Don't
- Gradientes, glow, glassmorphism, emojis como ícone, métricas inventadas. Os números da home vêm do banco.
- Limão como texto sobre fundo claro.
- Estender a bandeja de comparação além de busca e perfil.
- Criar variantes de botão ou cor para telas isoladas; evolua o token.

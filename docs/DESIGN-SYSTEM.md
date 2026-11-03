# Identidade e design system — Proposta.dev (MVP 2)

Substitui a versão do MVP 1 ("diretório editorial sóbrio"), por decisão do dono do produto registrada em docs/adr/0003-mvp2-contas-e-triagem.md (item 7). A descrição visual e os tokens estruturados estão em `DESIGN.md`. Este documento diz **como usar**.

## Direção
"Régua de preço". O produto mostra quanto um serviço costuma custar; a marca é uma barra com a faixa central em limão, e o gesto se repete: ilustração da home, avatar, nota, estatística de preço. Papel esverdeado, tinta verde-floresta, um destaque limão. Títulos grandes em Bricolage Grotesque, texto em Figtree. Moderno e direto, sem aparência de template: sem gradientes, brilhos, sombras em repouso ou métricas fictícias.

## Tokens (`src/app/globals.css`)
| Token | Claro | Escuro | Uso |
|---|---|---|---|
| background | #F1F3EC | #0B1410 | Fundo |
| card | #FAFBF6 | #121E18 | Superfícies |
| foreground | #10231A | #E9EFE3 | Texto |
| muted | #E4E8DC | #1A2A21 | Superfície secundária |
| muted-foreground | #46574D | #A0B3A6 | Metadados |
| border | #C9D1C0 | #2C3F34 | Campos, separadores |
| primary | #0F3D2E | #D4F25A | Botão, destaque escuro, rodapé |
| accent-fill / accent-ink | #D4F25A / #10231A | #D4F25A / #0B1410 | Destaque limão |
| ring | #0F3D2E | #D4F25A | Foco (outline 3px) |
| destructive / success | #A8261C / #17653A | #FF8F84 / #7FDC9F | Erro / confirmação |

Mapeados para o tema Tailwind/shadcn via `@theme inline`; não espalhar hex. O tema segue `prefers-color-scheme`.

## Tipografia
`next/font/google`: Bricolage Grotesque (`--font-bricolage`: títulos, marca, preços) e Figtree (`--font-figtree`: corpo). h1 fluido (`clamp`), h2 22–30px, h3 18px, corpo 16px/1.6. Inputs com 16px no mobile.

## Forma e espaço
Escala 4, 8, 12, 16, 24, 32, 48, 64. Contêiner 1240px, gutter 16/24px. Pílula para botões e etiquetas, 18px para superfícies, 10px para campos. Superfícies separadas por degrau de tom.

## Componentes base
`Wordmark`, `SiteHeader`, `SiteFooter`, `Button`, `Card`, `Badge`, `Input`, `Textarea`, `Skeleton`, `Sheet`, `PriceRuler` (decorativa sem props; com dados mostra faixa, média e a posição do orçamento ou do valor da Proposta; `sujeito="proposta"` marca o valor com um ponto na triagem do Cliente e `compact` reduz a régua e a legenda para o cartão de Proposta); classes `.button(.secondary|.accent|.danger)`, `.panel(.tone)`, `.field`, `.badge(.accent)`, `.empty`, `.stack`, `.inline`, `.form-grid`, `.checkbox`. Cadastro, entrada e painel herdam o visual por esses nomes. Próximos tickets: reutilizar, não recriar.

## Composição por página
- **Header** sticky: marca, 3 links, "Minha conta". No mobile, links em segunda linha.
- **Home**: título grande à esquerda; à direita o **slot da Triagem** (cartão verde `.triage-slot` com a entrada da Triagem: atalhos de objetivo e "Começar a Triagem"; a busca é o link secundário); abaixo, catálogo por categoria, explicação e convite a prestadores em limão.
- **Busca**: filtros em cartão lateral (Sheet no mobile), estatística de preço em cartão escuro, resultados como cartões horizontais com preço em destaque.
- **Perfil**: avatar circular em limão, contato em cartão, ofertas e avaliações em cartões. Avaliação verificada: borda `--primary` e selo `.verified-seal` (limão, ícone de check, "Contratado pela Proposta.dev"). Avaliação anterior: borda tracejada, sem fundo, nota `.previous-note` em itálico discreto; nunca mostra o selo.
- **Comparação**: tabela em cartão, rolagem horizontal só dentro dela; bandeja flutuante escura (só busca e perfil).
- **Footer**: bloco verde com três colunas e o aviso de que pagamento e contrato são combinados entre Cliente e Prestador.

## Acessibilidade e QA
Foco visível, contraste AA nos dois temas, alvos de 44px, labels persistentes, skip link, `prefers-reduced-motion`. Verificar 375/768/1440 sem overflow horizontal (só a tabela de comparação rola). Microcopy em pt-BR direta: "Buscar serviços", "Ver perfil", "Comparar", "Entrar em contato".

## Triagem de Propostas (ticket 06)
Cartão `.proposal-card` em grade de 1 a 2 colunas: Prestador e status, valor e prazo em destaque, régua compacta, mensagem recolhida em `<details>` e ações. Ordenação e filtro são links (`.filter-link`, `aria-current`); aceitar e recusar abrem `details.confirm` (o aceite usa `.confirm.accept`, em verde, não em vermelho). O Prestador escolhido aparece em `.accepted-provider`; o contato do Cliente, em `.client-contact`.

## Frontend v3 (03/11/2026)
Mesma marca, execução nova: campos chapados (`.on-forest`, `.on-lime`), títulos em peso 800, painel com navegação lateral, autenticação em duas metades e a régua como peça central. Movimento, tokens e regras estão em `DESIGN.md`, seção Motion. Arquivos: `src/app/shell.css` (casca e estados), `src/app/home.css` (home) e `src/app/motion.css` (movimento).

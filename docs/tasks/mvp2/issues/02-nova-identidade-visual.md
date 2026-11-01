# 02: Nova identidade visual e shell

**What to build:** o Proposta.dev ganha uma identidade moderna (marca, tipografia, paleta, tokens claro/escuro, componentes base, header, footer e home), aplicada nas telas públicas existentes. DESIGN.md e docs/DESIGN-SYSTEM.md são reescritos para a nova direção. A home ganha a entrada da Triagem ("O que você precisa?").

**Blocked by:** None (can start immediately)

**Status:** done (aguardando merge)

- [x] Direção visual registrada em DESIGN.md e docs/DESIGN-SYSTEM.md — "régua de preço", reescritos em 01/11/2026
- [x] Tokens e componentes base usados por home, busca, perfil e comparação — tokens em globals.css, Wordmark/SiteHeader/SiteFooter/Card/PriceRuler e ui/* restilizados; verificado no browser do Orca em /, /buscar, /prestadores/prestador-demo-1 e /comparar, console e rede sem erros
- [x] Responsivo em 375/768/1440 sem overflow (scrollWidth <= innerWidth nas 4 rotas); foco visível por outline 3px e contraste AA por tokens (não medido com ferramenta automática)
- [x] Testes E2E públicos existentes continuam passando — lint, typecheck, test (28) e E2E_PORT=3102 test:e2e (8/8) verdes

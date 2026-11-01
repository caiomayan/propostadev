# 09: Seed de demonstração e acabamento

**What to build:**
- Seed idempotente com dados realistas cobrindo todos os estados: Clientes, Prestadores, Projetos abertos/encerrados/cancelados, Propostas em todos os estados e Avaliações verificadas e antigas.
- Todas as telas restantes na nova identidade.
- Auditoria de acessibilidade e responsividade.
- Estados vazios e de erro revisados.

**Blocked by:** 02, 07

**Status:** ready-for-agent

- [ ] Seed roda duas vezes sem duplicar; contas demo no README
- [ ] Revisão visual 375/768/1440 sem overflow; teclado nas jornadas principais
- [ ] Console e rede limpos em todas as rotas

## Parte A (acabamento das telas existentes) — em andamento

Feito: menu móvel acessível (Radix Sheet; aria-expanded, foco preso e devolvido, Escape fecha, Minha conta/Entrar); visão geral do Prestador com próximo passo e situação; perfil, conta e ofertas com seções, ajuda e erro por campo; PriceRuler na lista e na edição de ofertas (posição do preço na faixa de referência); perfil público com herói, coluna de contato e cartões de oferta; /comparar com preço e prazo em destaque; 404, erro e loading (comparar, prestadores). Verificado no browser do Orca em 375/768/1440 (painel, perfil, ofertas, nova oferta, conta, perfil público, /comparar, 404): sem overflow, console sem erros, rede só com o 404 esperado.

Pendente: 2 E2E falhando (private.spec.ts:49, status 404 ao editar oferta de outra conta; public.spec.ts:168, iniciais do avatar na foto indisponível), a investigar; revisão em modo claro; auditoria final de contraste.

Parte B (fica): seed demo com Propostas e acabamento das telas novas.

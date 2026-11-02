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

## Parte A (acabamento das telas existentes) — concluída

Feito: menu móvel acessível (Radix Sheet; aria-expanded, foco preso e devolvido, Escape fecha, Minha conta/Entrar); visão geral do Prestador com próximo passo e situação; perfil, conta e ofertas com seções, ajuda e erro por campo; PriceRuler na lista e na edição de ofertas (posição do preço na faixa de referência); perfil público com herói, coluna de contato e cartões de oferta; /comparar com preço e prazo em destaque; 404, erro e loading (comparar, prestadores). Verificado no browser do Orca em 375/768/1440 (painel, perfil, ofertas, nova oferta, conta, perfil público, /comparar, 404): sem overflow, console sem erros, rede só com o 404 esperado.

Fechamento pelo coordenador (02/11): as 2 falhas de E2E eram seletores e textos alterados de propósito pelo acabamento: a classe do herói do perfil passou a ser `.profile-hero`, a saudação usa o primeiro nome e a conta ganhou o medidor de força da senha (`role=status`). Um item era regressão real: o link "Ver meu perfil público" só aparecia com tudo publicado. Agora fica sempre na seção Situação, e o "Tudo pronto" leva a Oportunidades. O 404 da oferta de outra conta voltou a passar depois do merge do mvp2. A navegação principal ganhou o link "Triagem". Modo claro conferido no perfil público (cores computadas corretas); /comparar, 404, /buscar e /triagem em 375 sem overflow e sem erros no console. Bateria: lint, typecheck, unitários 59, integração 46, E2E 22.

Parte B (fica): seed demo com Propostas e acabamento das telas novas. Achados do coordenador para a parte B:
- textos do MVP 1 que contradizem as Propostas: na home, "a conversa e a negociação acontecem fora daqui"; no rodapé, "Proposta.dev é um diretório" e "A negociação acontece direto com o prestador"; no perfil público, "O contato acontece fora da Proposta.dev";
- em 1440, o detalhe da Oportunidade usa uma coluna estreita e deixa a direita vazia (o formulário de Proposta poderia virar coluna lateral);
- a navegação do painel em 375 quebra em duas linhas com o "Sair" sozinho;
- o seed demo precisa de um Cliente com nome real (hoje aparece "Cliente: Cliente").

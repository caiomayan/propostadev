# Relatório do worker: ticket 06 (Triagem de Propostas e Aceite)

Branch `caiomayan/mvp2-06-aceite` (a partir de `mvp2`), commitada e **não publicada** (sem push; o coordenador integra).

## Commits
- `4c77a63` feat: triagem de propostas e aceite transacional do Cliente (ticket 06)
- `d240672` test: jornada de triagem e aceite e evidência do ticket 06
- `d19a26c` fix: texto do cartão de proposta fala com o Cliente em segunda pessoa

## Verificação (no código final)
lint e typecheck limpos; unit 62; integração 58 (inclui tests/integration/acceptance.test.ts); `pnpm build` e `E2E_PORT=3106 test:e2e` com 23 passando (inclui tests/e2e/acceptance.spec.ts). Browser do Orca em 375 e 1440: triagem aberta (com e sem Preço de referência), pós-aceite do Cliente e "Minhas propostas" do Prestador aceito; `scrollWidth` igual à largura da janela, console sem erros e rede sem status >= 400. Só o tema escuro foi visto; os estilos novos usam apenas tokens.

## Decisões fora do spec
1. As Server Actions do Cliente usam `getSession` + `accountTypeDenial` (padrão já usado em projects/proposals actions) em vez de `requireCliente`: devolvem `{ error }` em vez de redirecionar, e o mock dos testes de integração funciona. Dono e tipo de conta saem sempre da sessão.
2. O Aceite trava a linha do Projeto (`SELECT … FOR UPDATE OF p`) antes das atualizações; sem isso dois aceites de Propostas diferentes podem terminar em deadlock (40P01). 23505, 40P01 e 40001 viram a mesma mensagem amigável.
3. Ordem padrão: ACEITA, PRE_SELECIONADA, ENVIADA, RECUSADA, e a mais recente primeiro dentro de cada grupo. Nas ordens `valor`, `prazo` e `reputacao`, RECUSADA fica por último. Reputação: verificadas desc, nota desc, número de avaliações desc, valor asc.
4. Propostas RETIRADA continuam ocultas para o Cliente (comportamento do ticket 05 mantido).
5. "Dentro do prazo" = exatamente o prazo desejado; menos dias = "N dias antes do desejado"; mais = "N dias além do desejado"; Projeto flexível = "Prazo desejado flexível".
6. Cada cartão traz também a relação do valor com o orçamento do Cliente ("Dentro/Abaixo/Acima do seu orçamento"); sem Preço de referência, mostra só o valor e a faixa do orçamento.
7. `pre=1` só vale com Projeto ABERTO; `ordem` inválida cai na ordem padrão (zod enum). O filtro "Só pré-selecionadas" some em Projeto encerrado/cancelado.
8. Escopo de limite de mutações `triage` (20 por minuto por Cliente).
9. `PriceRuler` ganhou `sujeito="proposta"` (marcador pontual, "O valor da proposta está…") e `compact`; `positionSentence`/`posicaoValor`/`compareDeadline` em modules/triage/position.ts.
10. `listProjectProposals` (projects/queries) foi movida e ampliada como `listProposalsForTriage` (proposals/queries); ajustei o teste do ticket 05 que a usava e um seletor do E2E do ticket 05 (`getByText("R$ 1.750,50")` agora é ambíguo por causa da régua).
11. Ponto do ticket 07: `verifiedCount` em modules/proposals/queries.ts (constante 0) e o comentário em components/proposals/proposal-card.tsx; a ordem por reputação já o usa.
12. Sem migration nova; nenhuma regra de spec ou GLOSSARY mudou (usei os termos Proposta, Aceite, Preço de referência). Atualizei o checklist do ticket 06 e docs/DESIGN-SYSTEM.md.

## Para o coordenador decidir
- **Contatos do Prestador escolhido depois de desativar o Perfil**: aparecem mesmo assim (o Prestador os consentiu ao publicar), mas o link para o Perfil público é omitido, porque a página dá 404 para perfil inativo.

## Observação não reproduzida
Uma única vez, sob `next dev`, a primeira Server Action do Cliente (aceite) viu a sessão como nula ("Entre como Cliente…") e o redirecionamento seguinte levou a /entrar. Descartado: o segredo está definido, o cookie estava presente e válido depois, as demais ações e o aceite funcionaram na sequência, e o mesmo fluxo passa no E2E sob `next start`. Não consegui reproduzir.

## Ambiente
Bases `propostadev_w06` e `propostadev_w06_test` no contêiner compartilhado (não foi parado). Servidor da porta 3006 e aba do browser encerrados.

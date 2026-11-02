# 07: Avaliações verificadas

**What to build:**
- Só o Cliente com Proposta aceita de um Prestador pode avaliá-lo, com checagem no servidor e trigger no banco.
- A avaliação aparece com o selo "Contratado pela Proposta.dev".
- As avaliações do MVP 1 continuam, marcadas como anteriores e sem verificação.
- O Perfil mostra a média e a contagem de verificadas.
- O Projeto encerrado convida o Cliente a avaliar.

**Blocked by:** 06

**Status:** done

- [x] Testes: sem Aceite → recusa; com Aceite → cria; edição/exclusão própria. Evidência: tests/integration/reviews.test.ts (action e trigger por SQL direto, edição/exclusão só do autor, antigas editáveis) e tests/e2e/acceptance.spec.ts (Cliente avalia pelo Projeto ENCERRADO → Perfil com selo e "1 verificada").
- [x] Agregados corretos e sem duplicação por joins. Evidência: reviews.test.ts, caso de dois Aceites do mesmo Cliente em Projetos diferentes (Perfil, busca, compatíveis e cartões de Proposta: 3 avaliações, 2 verificadas).
- [x] Textos de reputação atualizados (sem "contratação não verificada" nas verificadas). Evidência: ReviewBadge mostra o selo ou a nota "anterior", nunca os dois; verificado no browser em 375 e 1440 (Perfil e Projeto ENCERRADO), sem erro de console nem status ≥ 400 do app.

## Evidência final
lint e typecheck limpos; unit 62; integração 67; `pnpm build` e `E2E_PORT=3107 pnpm test:e2e` com 23 passando. Relatório: docs/tasks/mvp2/reports/07-avaliacoes-verificadas.md.

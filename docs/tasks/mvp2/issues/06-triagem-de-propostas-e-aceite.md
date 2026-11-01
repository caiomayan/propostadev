# 06: Triagem de Propostas e Aceite

**What to build:** o Cliente vê as Propostas de um Projeto lado a lado: valor vs Preço de referência, prazo vs desejado, nota e verificadas. Ele ordena, pré-seleciona, filtra, recusa e aceita uma, com confirmação. O Aceite encerra o Projeto, recusa as demais e libera os contatos: o Cliente vê os do Prestador, e o Prestador vê nome e e-mail do Cliente.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] Aceite transacional; teste de dois aceites concorrentes resultando em um só
- [ ] Transições inválidas recusadas no servidor (Projeto não ABERTO, não dono)
- [ ] E2E: publicar → propor → aceitar → contatos liberados

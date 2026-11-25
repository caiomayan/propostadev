# 02: Painel da plataforma para conceder o VIP

**What to build:** rota `/plataforma` só para a Equipe da plataforma (`PLATAFORMA_EMAILS`, e-mail confirmado; os demais recebem 404). Duas listas: "Pediram o VIP" (Interesse no VIP de quem ainda não é VIP, com a data) e "VIP agora", com os botões "Conceder VIP" e "Retirar VIP". Link "Plataforma" no menu da conta só para a Equipe. Seed demo no seu módulo `scripts/demo-mvp3/plataforma.ts`: conta `plataforma@demo.example` com e-mail confirmado e Interesses no VIP de 2 Prestadores demo não VIP (nunca o prestador1). `pnpm demo:apresentacao` volta o VIP das contas demo ao conjunto do seed. Sem migration. Spec: histórias 4–9. ADR 0005, decisão 2.

**Blocked by:** None

**Status:** ready-for-agent

- [ ] Unidade: leitura de `PLATAFORMA_EMAILS` (vazia, espaços, caixa).
- [ ] Integração: página e ações recusam quem não é da Equipe (inclusive e-mail não confirmado); conceder e retirar mudam só `vip`; o Interesse no VIP continua registrado.
- [ ] Ações validam entrada e sessão no servidor; o id do Prestador vem do formulário, mas a autorização vem só da sessão.
- [ ] E2E: plataforma@demo.example concede VIP a quem pediu e o selo VIP aparece no Perfil; visitante e prestador1 recebem 404.
- [ ] `.env.example` e README documentam `PLATAFORMA_EMAILS`.
- [ ] Verificado no browser em 375 e 1440 px, console limpo.

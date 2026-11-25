# 02: Painel da plataforma para conceder o VIP

**What to build:** rota `/plataforma` só para a Equipe da plataforma (`PLATAFORMA_EMAILS`, e-mail confirmado; os demais recebem 404). Duas listas: "Pediram o VIP" (Interesse no VIP de quem ainda não é VIP, com a data) e "VIP agora", com os botões "Conceder VIP" e "Retirar VIP". Link "Plataforma" no menu da conta só para a Equipe. Seed demo no seu módulo `scripts/demo-mvp3/plataforma.ts`: conta `plataforma@demo.example` com e-mail confirmado e Interesses no VIP de 2 Prestadores demo não VIP (nunca o prestador1). `pnpm demo:apresentacao` volta o VIP das contas demo ao conjunto do seed. Sem migration. Spec: histórias 4–9. ADR 0005, decisão 2.

**Blocked by:** None

**Status:** done

- [x] Unidade: leitura de `PLATAFORMA_EMAILS` (vazia, espaços, caixa).  
  Evidência: `pnpm test` → 106 passam, incluindo `tests/unit/plataforma-emails.test.ts`.
- [x] Integração: página e ações recusam quem não é da Equipe (inclusive e-mail não confirmado); conceder e retirar mudam só `vip`; o Interesse no VIP continua registrado.  
  Evidência: `pnpm test:integration` → 98 passam, incluindo `tests/integration/plataforma.test.ts` (a coluna `updated_at` é mexida por trigger do banco; o resto da linha fica igual).
- [x] Ações validam entrada e sessão no servidor; o id do Prestador vem do formulário, mas a autorização vem só da sessão.  
  Evidência: `src/modules/plataforma/actions.ts` (zod uuid + `isPlataformaUser(sessão)` + rate limit); teste com sessão de Prestador dono do pedido recusada.
- [ ] E2E: plataforma@demo.example concede VIP a quem pediu e o selo VIP aparece no Perfil; visitante e prestador1 recebem 404.  
  Escrito em `tests/e2e/plataforma.spec.ts` (e `PLATAFORMA_EMAILS` no `playwright.config.ts`); não rodado localmente por regra do brief, fica para o CI. O mesmo fluxo foi feito à mão no portal (conceder → selo VIP no Perfil → retirar).
- [x] `.env.example` e README documentam `PLATAFORMA_EMAILS`.
- [x] Verificado no browser em 375 e 1440 px, console limpo.  
  Evidência: portal do Maestri, `next dev` na 3101; sem overflow horizontal em 375; visitante recebe 404; log do dev só com o aviso preexistente de `scroll-behavior`.

- Produção (25/11, PR #12): `/plataforma` 404 para visitante; pedidos de VIP de Clara Medeiros e Henrique Batista gravados. A conta `plataforma@demo.example` só é criada quando `DEMO_PASSWORD` estiver em `~/.config/propostadev/producao.env` (o reset recusa a senha pública fora do banco local).

# 01: Demo realista com aviso no rodapé

**What to build:** nomes de pessoa (PF) e de empresa (PJ), slugs gerados do nome, contato em domínio `.example` e textos sem repetição; linha no rodapé avisando que os dados são fictícios; módulo idempotente que aplica a mudança em produção só nas contas `@demo.example`; testes, roteiro e README atualizados. Spec: histórias 1–3. ADR 0005, decisão 1.

**Blocked by:** None

**Status:** in-progress (coordenador; falta rodar em produção depois do merge)

- [x] Nenhum "— Demo" nem `prestador-demo-` visível nas telas públicas (local: /buscar sem "— Demo"; `/prestadores/bruno-cavalcanti-8d2e47b1` 200 e `/prestadores/prestador-demo-2` 404).
- [x] Rodapé com o aviso de dados fictícios (portal local em 1900 e 375 px, sem overflow).
- [x] Módulos de demo identificam Prestadores pelo e-mail de login ou pela identidade em `scripts/demo-identidades.ts`; `scripts/demo-mvp3/identidades.ts` aplica a mudança ao banco existente (rodado 2x no banco local: 20 renomeados, idempotente; textos antigos zerados).
- [ ] Rodado em produção; `/prestadores/<novo-slug>` responde 200.

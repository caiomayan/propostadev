# 01: Demo realista com aviso no rodapé

**What to build:** nomes de pessoa (PF) e de empresa (PJ), slugs gerados do nome, contato em domínio `.example` e textos sem repetição; linha no rodapé avisando que os dados são fictícios; módulo idempotente que aplica a mudança em produção só nas contas `@demo.example`; testes, roteiro e README atualizados. Spec: histórias 1–3. ADR 0005, decisão 1.

**Blocked by:** None

**Status:** ready-for-agent (coordenador)

- [ ] Nenhum "— Demo" nem `prestador-demo-` visível nas telas públicas.
- [ ] Rodapé com o aviso de dados fictícios.
- [ ] Módulos de demo do MVP 3 identificam Prestadores pelo e-mail de login.
- [ ] Rodado em produção; `/prestadores/<novo-slug>` responde 200.

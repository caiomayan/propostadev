# 03: Tipo de conta Cliente ou Prestador

**What to build:** o cadastro pede o tipo de conta, com uma explicação curta. Contas antigas migram: quem tem perfil vira Prestador e o resto vira Cliente. O painel e as rotas privadas mudam conforme o tipo, e as Server Actions de perfil/oferta recusam Cliente. A avaliação passa a exigir Cliente; a regra completa de verificação vem no ticket 07.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Campo adicional no usuário do Better Auth via CLI de geração; migration com backfill
- [ ] Tipo imutável no servidor; sem tipo → /boas-vindas
- [ ] Painel do Cliente e painel do Prestador com navegação própria
- [ ] Testes de integração: Cliente não cria perfil/oferta; Prestador não acessa rotas de Cliente
- [ ] E2E de cadastro para os dois tipos

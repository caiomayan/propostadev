# 03: Tipo de conta Cliente ou Prestador

**What to build:** o cadastro pede o tipo de conta, com uma explicação curta. Contas antigas migram: quem tem perfil vira Prestador e o resto vira Cliente. O painel e as rotas privadas mudam conforme o tipo, e as Server Actions de perfil/oferta recusam Cliente. A avaliação passa a exigir Cliente; a regra completa de verificação vem no ticket 07.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Campo adicional no usuário do Better Auth via CLI de geração; migration com backfill — `additionalFields` (`tipo_conta`, `input: false`) em `src/lib/auth/user-fields.ts`; `pnpm auth:generate` regenerou `auth-schema.ts`; migration `drizzle/0002_tipo-conta.sql` (check, backfill, trigger). Evidência: `tests/integration/account-type.test.ts` (backfill, check, sign-up/update forjados recusados).
- [x] Tipo imutável no servidor; sem tipo → /boas-vindas — `setAccountType` (UPDATE condicional) + trigger `user_tipo_conta_imutavel`; `requireAccount` redireciona. Evidência: testes de integração e E2E "conta sem tipo…"; verificado no browser do Orca (console e rede sem erros).
- [x] Painel do Cliente e painel do Prestador com navegação própria — `src/app/painel/layout.tsx` e `page.tsx`. Evidência: E2E de cadastro dos dois tipos; browser do Orca.
- [x] Testes de integração: Cliente não cria perfil/oferta; Prestador não acessa rotas de Cliente — `tests/integration/account-type.test.ts` e `tests/unit/private-actions.test.ts`. As rotas de Cliente ainda não existem (ticket 04); por ora, Prestador não avalia.
- [x] E2E de cadastro para os dois tipos — `tests/e2e/private.spec.ts` (Cliente, Prestador, /boas-vindas).

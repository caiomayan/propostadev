# 08: Autenticação enriquecida

**What to build:**
- Telas de entrar e cadastro com mostrar/ocultar senha e indicador de força.
- Login com GitHub e Google quando as credenciais existem, com /boas-vindas para escolher o tipo de conta no primeiro acesso.
- Recuperação de senha e verificação de e-mail via SMTP quando configurado; em desenvolvimento, o link vai para o console.
- Aviso não bloqueante de e-mail não verificado.

**Blocked by:** 03

**Status:** done

- [x] Botões OAuth ausentes sem credenciais; presentes com elas. Evidência: tests/unit/auth-providers.test.ts, E2E `sem credenciais…`, e no browser do Orca (dev na 3008) só o botão GitHub com variáveis fictícias. O handshake real com GitHub/Google não foi testado: não há credenciais, e o redirect usa `signInSocial` do Better Auth
- [x] Fluxo de redefinição testado ponta a ponta (token expira, uso único). Evidência: tests/integration/auth-recovery.test.ts (válido, reutilizado, expirado, sessões revogadas), tests/e2e/auth.spec.ts e fluxo manual no browser do Orca pelo link do console
- [x] Mensagens não revelam existência de e-mail. Evidência: resposta neutra idêntica para e-mail existente e inexistente (integração e E2E); login e cadastro mantêm erros genéricos
- [x] Variáveis documentadas em .env.example e README (seção "Login social e e-mail", com as URLs de callback)

# 08: Autenticação enriquecida

**What to build:**
- Telas de entrar e cadastro com mostrar/ocultar senha e indicador de força.
- Login com GitHub e Google quando as credenciais existem, com /boas-vindas para escolher o tipo de conta no primeiro acesso.
- Recuperação de senha e verificação de e-mail via SMTP quando configurado; em desenvolvimento, o link vai para o console.
- Aviso não bloqueante de e-mail não verificado.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Botões OAuth ausentes sem credenciais; presentes e funcionais com elas
- [ ] Fluxo de redefinição testado ponta a ponta (token expira, uso único)
- [ ] Mensagens não revelam existência de e-mail
- [ ] Variáveis documentadas em .env.example e README

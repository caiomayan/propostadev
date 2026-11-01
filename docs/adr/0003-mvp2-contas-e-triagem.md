---
status: accepted
supersedes: escopo de ADR 0001 (seções "Decisão" e "Evolução") e "Fora do escopo" do PRD para os itens abaixo
---

# ADR 0003 — MVP 2: contas separadas, triagem de projetos e avaliações verificadas

Decidido em 01/11/2026 por delegação explícita do dono do produto, para a Review da Sprint 3 (04/11/2026).

O MVP 1 tratava Cliente como papel e excluía triagem, projetos e propostas (ADR 0001). O MVP 2 do board da equipe pede o contrário: separação de contas, triagem de propostas de projetos e avaliações "fiéis". Decidimos:

1. **Conta tem um tipo exclusivo, Cliente ou Prestador**, escolhido no cadastro (ou no primeiro acesso via OAuth) e imutável. O Cliente publica Projetos, triagem e avalia. O Prestador mantém Perfil e Ofertas e envia Propostas. Contas existentes migram: quem tem perfil de prestador vira Prestador; o resto vira Cliente. O tipo vive como campo adicional do usuário do Better Auth, com o schema regenerado pela CLI.
2. **Triagem é o fluxo guiado em que o Cliente descreve um Projeto** e recebe, para o tipo de serviço escolhido, o preço de referência (a média de S07 mais a faixa de preços anunciados) e os Prestadores compatíveis numa ordem transparente. A partir daí ele publica o Projeto, convida Prestadores e decide entre as Propostas recebidas: pré-seleciona, recusa ou aceita uma.
3. **Propostas são respostas de Prestadores a um Projeto aberto.** O aceite fecha o Projeto, recusa as demais e libera os contatos dos dois lados. Negociação, contrato e pagamento continuam fora da plataforma.
4. **Só avalia quem contratou.** Novas avaliações exigem uma Proposta aceita entre o Cliente e o Prestador. Recebem o selo "Contratado pela Proposta.dev". As avaliações do MVP 1 permanecem, sem selo.
5. **Auth continua no Better Auth**, e não no Clerk citado no board. Trocar significaria reescrever sessão, sincronizar usuários por webhook e refazer testes a 3 dias da review. O Clerk de produção também exige domínio próprio. Somam-se OAuth GitHub/Google e e-mail transacional (recuperação e verificação) via SMTP, ativados apenas quando as credenciais existem.
6. **Produção em Vercel + Supabase Postgres** (o banco que a equipe já usa), com migrations Drizzle versionadas e seed de demonstração.
7. **Nova identidade visual**, autorizada pelo dono, substituindo o "diretório editorial sóbrio" de docs/DESIGN-SYSTEM.md.

## Consequências
- O glossário redefine Cliente: deixa de ser um papel e passa a ser um tipo de conta. Um Prestador não publica Projetos, e um Cliente não tem Perfil público.
- S01 e S06 da spec do MVP 1 são substituídos pela spec em docs/tasks/mvp2/spec.md.
- Continuam fora: pagamentos, taxas, contratos, chat em tempo real e painel administrativo.
- Ordem de corte, se o prazo apertar: as Propostas caem antes da triagem com Prestadores compatíveis e preço de referência, que são o núcleo pedido.

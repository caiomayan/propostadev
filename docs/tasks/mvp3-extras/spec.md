# Spec — Extras do MVP 3: demo realista, painel do VIP, Avisos e correções da retro

Status: ready-for-agent
Decisões: docs/adr/0005-mvp3-extras.md (e ADR 0004, que continua valendo). Vocabulário: GLOSSARY.md.
Prazo: em produção até 12h30 de 25/11/2026 (Review da Sprint 4).

## Problem Statement

A demo em produção tem cara de teste: todo Prestador termina em "— Demo" e o endereço do Perfil é `prestador-demo-N`. O Interesse no VIP cai no banco e ninguém da plataforma vê; conceder o VIP exige SQL. Quem recebe um Convite ou uma Proposta só descobre se abrir a página certa. E a queda de produção de 24/11 mostrou dois buracos: o log do build não dizia a causa e nada avisou que o site estava fora.

## Solution

- **Demo realista**: nomes de pessoa e de empresa, endereços gerados do nome, contatos com cara de empresa em domínio que não entrega e textos sem repetição. Uma linha no rodapé avisa que perfis, Projetos e Avaliações são fictícios.
- **Painel da plataforma**: a Equipe da plataforma vê quem pediu o VIP e quem é VIP, e concede ou retira o VIP com um clique.
- **Avisos**: um sino no topo mostra quantos Avisos não lidos o usuário tem; a lista leva a cada Projeto ou Proposta.
- **Retro**: o script de migration mostra o código do erro; uma checagem agendada testa a home e falha (o GitHub avisa o dono) se ela cair.

## User Stories

### Demo realista
1. Como visitante, quero ver Prestadores com nomes de pessoa ou de empresa, para a demo parecer um produto em uso.
2. Como visitante, quero saber que os dados são fictícios, por uma linha no rodapé.
3. Como apresentador, quero entrar com as mesmas contas `@demo.example`, para não mudar o combinado com a equipe.

### Painel da plataforma
4. Como Equipe da plataforma, quero ver os Prestadores que registraram Interesse no VIP e ainda não são VIP, com a data do pedido.
5. Como Equipe da plataforma, quero conceder o VIP a um deles com um clique, e ele passa a ter o selo VIP e a poder aparecer no Destaque VIP.
6. Como Equipe da plataforma, quero ver os Prestadores VIP e retirar o VIP de um deles.
7. Como Equipe da plataforma, quero encontrar o painel pelo menu da minha conta.
8. Como qualquer outro usuário (ou visitante), não quero nem saber que o painel existe: o endereço responde 404 e o menu não mostra o link.
9. Como Prestador, quero que conceder ou retirar o VIP não mexa no meu selo de confiança nem na Triagem (ADR 0004).

### Avisos
10. Como Prestador, quero um Aviso quando receber um Convite, com link para a Oportunidade.
11. Como Cliente, quero um Aviso quando um Prestador enviar Proposta para o meu Projeto, com link para o Projeto.
12. Como Prestador, quero um Aviso quando minha Proposta for pré-selecionada, aceita ou recusada.
13. Como usuário, quero ver no topo do site quantos Avisos não lidos tenho (some quando é zero).
14. Como usuário, quero uma lista dos meus Avisos mais recentes, com os não lidos destacados, e marcar todos como lidos.
15. Como usuário, quero que abrir um Aviso o marque como lido.
16. Como usuário, nunca quero ver Avisos de outra pessoa.

### Retro
17. Como dono, quero que o log do build diga o código do erro do banco quando a migration falhar (sem imprimir a URL nem a senha).
18. Como dono, quero ser avisado se a home de produção cair.

## Implementation Decisions

- Demo: os módulos de demo identificam os Prestadores pelo e-mail de login (`prestadorN@demo.example`), nunca pelo slug. A renomeação em produção é um módulo idempotente que só toca contas `@demo.example`.
- Painel: rota `/plataforma`, Server Component; acesso por `PLATAFORMA_EMAILS` (lista separada por vírgula, comparação sem caixa) com e-mail confirmado; checagem server-only reaproveitada pela página e pelas ações. Sem migration. A demo cria a conta `plataforma@demo.example` (e-mail confirmado) e alguns Interesses no VIP de Prestadores demo não VIP, sem incluir o prestador1 (o roteiro registra o interesse dele ao vivo). `pnpm demo:apresentacao` volta o VIP da demo ao conjunto do seed.
- Avisos: tabela nova (migration 0008, aditiva, com RLS), gravada na mesma transação da ação. Tipos: CONVITE_RECEBIDO, PROPOSTA_RECEBIDA, PROPOSTA_PRE_SELECIONADA, PROPOSTA_ACEITA, PROPOSTA_RECUSADA (inclusive as recusadas automaticamente por um aceite, se o código fizer isso). Lista em `/painel/avisos` (os 50 mais recentes). A demo cria Avisos para prestador1 e cliente1 a partir dos dados que já existem.
- Retro: `scripts/migrate.ts` mostra `code` e a mensagem do erro do driver sem a connection string; workflow agendado no GitHub Actions (repo público, sem custo) que testa `/` e `/buscar` a cada 30 minutos.

## Testing Decisions

- Integração: o painel recusa quem não está na lista (página e ações); conceder e retirar mudam só a coluna `vip`; cada ação gera o Aviso certo para a pessoa certa; ler e marcar como lido só valem para os Avisos do próprio usuário.
- E2E: Equipe concede VIP a quem pediu; Prestador vê o Aviso do Convite e o número some depois de ler; visitante recebe 404 em `/plataforma`.
- Unidade: lista de e-mails da Equipe (vazia, espaços, caixa).

## Out of Scope

- E-mail, push ou tempo real para Avisos; preferências de Aviso.
- Conceder selo pela plataforma; outros poderes da Equipe (moderação, banimento).
- Fotos de pessoas na demo.

## Further Notes

- `PLATAFORMA_EMAILS` em Production: `plataforma@demo.example`. O dono pode acrescentar o próprio e-mail depois.

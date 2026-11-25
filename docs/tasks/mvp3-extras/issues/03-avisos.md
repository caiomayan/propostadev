# 03: Avisos dentro do site

**What to build:** migration 0008 com a tabela de Avisos (aditiva, RLS habilitada como na 0006/0007). Gravar o Aviso na mesma transação de: Convite criado (CONVITE_RECEBIDO para o Prestador), Proposta enviada (PROPOSTA_RECEBIDA para o Cliente), Proposta pré-selecionada, aceita ou recusada (para o Prestador; inclui recusas automáticas, se houver). Sino no cabeçalho com o número de não lidos (some quando é zero; rótulo acessível "N avisos não lidos"). `/painel/avisos` com os 50 mais recentes, não lidos destacados, cada um com link ao destino; abrir um Aviso marca como lido; botão "Marcar todos como lidos". Seed demo no seu módulo `scripts/demo-mvp3/avisos.ts`: Avisos para prestador1 e cliente1 a partir dos Convites e Propostas que já existem, idempotente. Spec: histórias 10–16. ADR 0005, decisão 3.

**Blocked by:** None

**Status:** ready-for-agent

- [ ] Integração: cada ação gera um Aviso para a pessoa certa e nenhum para as outras; ler e marcar como lido só afetam os Avisos do usuário da sessão; Aviso de um Projeto apagado não quebra a lista.
- [ ] Contagem de não lidos numa consulta só (sem N+1) e só para quem está logado.
- [ ] E2E: Cliente convida, Prestador vê o número no sino, abre o Aviso, o número diminui.
- [ ] Verificado no browser em 375 e 1440 px (sino no menu mobile também), console limpo.

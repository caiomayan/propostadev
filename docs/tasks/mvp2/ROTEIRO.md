# Roteiro da apresentação: MVP 2 (Sprint 3 Review, 04/11/2026)

Endereço: https://propostadev-one.vercel.app

Perfis, projetos e propostas da demo são fictícios; diga isso ao abrir a apresentação. Os prestadores demo têm "— Demo" no nome.

Use uma janela anônima para cada conta (Cliente e Prestador) ou dois navegadores, porque a sessão é por navegador. A senha das contas demo é a combinada com a equipe; ela não fica no repositório.

| Conta | Papel | Para mostrar |
|---|---|---|
| cliente1@demo.example (Mariana Costa) | Cliente | Projeto aberto com 3 propostas; projeto encerrado e avaliado |
| cliente2@demo.example (Rafael Lima) | Cliente | Projeto aberto de API e projeto encerrado |
| cliente3@demo.example (Juliana Alves) | Cliente | Projeto sem orçamento definido, com proposta retirada; projeto cancelado |
| prestador2@demo.example (Horizonte Digital) | Prestador | Proposta pré-selecionada, proposta aceita com o contato do Cliente |
| prestador7@demo.example (Maré Sistemas) | Prestador | Oportunidade em aberto para enviar uma proposta ao vivo |
| cliente4, cliente5 e cliente6@demo.example | Cliente | Mais projetos abertos e encerrados, com avaliações verificadas |

## 1. O problema e a Triagem (visitante, cerca de 2 min)
1. Abra a home e use a régua: escolha **Site institucional** e arraste o orçamento. O número de prestadores muda na hora, com os preços reais anunciados.
2. Clique em **Começar a Triagem** e escolha "Quero divulgar um produto ou campanha" → **Landing Page**.
3. Preencha título, descrição, orçamento "Uma faixa" de R$ 800 a R$ 1.500 e prazo de 20 dias. A régua ao lado acompanha o que você digita. Clique em **Ver preço de referência**.
4. Mostre:
   - o **Preço de referência**: média de R$ 1.000 entre 3 prestadores, faixa de R$ 800 a R$ 1.200 e a régua com o orçamento;
   - os **Prestadores compatíveis**, com os motivos ("Dentro do orçamento", "Prazo compatível", avaliações verificadas).
5. Explique: sem conta, o visitante já sabe quanto custa e quem faz. Para publicar, precisa criar uma conta de Cliente, e o rascunho é mantido.

## 2. Contas separadas (cerca de 1 min)
1. Em **Criar conta de Cliente**, mostre a escolha "Quero contratar" ou "Quero oferecer serviços". O tipo é definitivo.
2. Contas de Prestador não publicam projetos, e contas de Cliente não enviam propostas.
3. A conta nova só abre o painel depois do código de 6 dígitos enviado por e-mail: use um endereço que exista (no Gmail, `seuemail+demo1@gmail.com` cai na sua caixa). As contas demo já estão confirmadas, então não mostram esse passo.

## 3. Triagem das Propostas e Aceite (Cliente, cerca de 3 min)
1. Entre como **cliente1**. No **Painel**, veja os projetos e o contador de propostas.
2. Abra **Site de lançamento da confeitaria**:
   - cada proposta aparece na régua de preço ("acima/dentro da faixa") e com o prazo comparado ao desejado ("8 dias antes do desejado");
   - mostre a ordenação (menor valor, menor prazo, melhor reputação) e o filtro "Só pré-selecionadas";
   - pré-selecione uma proposta;
   - abra **Aceitar proposta de…** e leia a confirmação: encerra o projeto e recusa as demais. Aceite ao vivo, ou mostre o projeto já encerrado do passo seguinte.
3. Depois do Aceite, o Prestador escolhido aparece em destaque, com os contatos dele.

## 4. Oportunidades e Proposta (Prestador, cerca de 2 min)
1. Em outra janela, entre como **prestador7**. Abra **Oportunidades**: os convidados vêm primeiro, com o selo "Convite".
2. Abra **Site do escritório de advocacia** e mostre o contexto do projeto ao lado do formulário. Envie uma proposta ao vivo (valor, prazo e mensagem com pelo menos 30 caracteres).
3. Em **Propostas**, mostre o status. Entre como **prestador2** para mostrar uma proposta **Aceita**, com o nome e o e-mail do Cliente liberados.

## 5. Avaliações verificadas (cerca de 1 min)
1. Como **cliente1**, abra **Site institucional da clínica veterinária** (encerrado): a avaliação feita depois do Aceite aparece ali.
2. No perfil público do Prestador avaliado, mostre:
   - o selo **"Contratado pela Proposta.dev"**;
   - a contagem de avaliações verificadas;
   - a diferença para uma "Avaliação anterior, sem contratação verificada" (perfil da Aurora Web).
3. Explique: só quem aceitou uma proposta daquele Prestador pode avaliá-lo, e a regra vale no servidor e no banco.

## 6. Experiência (cerca de 30 s)
- No celular (ou com o DevTools em 375 px), mostre o menu móvel e a navegação do painel.
- Recuperação de senha e login social aparecem quando as credenciais estão configuradas. Na demo, sem SMTP, a recuperação não é oferecida.

## Antes de apresentar
Aceites e propostas feitos em ensaios mudam a demo. Para restaurar o estado inicial, rode o seed demo contra a produção com `DEMO_RESET=true` (veja o README). O coordenador faz isso na noite de 03/11.

## Fora do escopo (ADR 0003)
Pagamento, chat e contrato ficam fora da plataforma. Depois do Aceite, Cliente e Prestador combinam esses pontos diretamente.

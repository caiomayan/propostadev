# Roteiro da apresentação: MVP 3 (Sprint 4 Review, 25/11/2026)

Endereço: https://propostadev-one.vercel.app. Dados da demo são fictícios, com nomes de pessoa e de empresa; o rodapé do site avisa isso (ADR 0005). Diga ao abrir a apresentação. Senha das contas demo: a combinada com a equipe, fora do repositório.

## Antes da apresentação (substitui a instrução do MVP 2)
Depois de qualquer ensaio, volte a demo ao ponto de partida. Na VM, com a URL de produção no ambiente (sem gravar em arquivo do repo):

```
cd ~/dev/propostadev && set -a && . ~/.config/propostadev/producao.env && set +a \
  && export DATABASE_URL="${DATABASE_URL/sslrootcert=supabase-ca.crt/sslrootcert=$HOME/.config/propostadev/supabase-ca.crt}" \
  && pnpm demo:apresentacao
```

Isso apaga só os Interesses no VIP das contas `@demo.example` (o botão "Tenho interesse" volta), devolve o VIP da demo ao conjunto original (desfaz o que foi concedido no painel), volta os Avisos da demo a "não lido" e reaplica selo, Oportunidades, VIP, pedidos de VIP e Avisos. Para criar a conta da Equipe na primeira vez, `producao.env` precisa de `DEMO_PASSWORD`. Não use `DEMO_RESET=true` sem necessidade: ele recria todos os Projetos dos Clientes demo. Os preços externos não mudam.

## 1. Selo de confiança (Erick, ~1 min, visitante)
1. Abra **Buscar desenvolvedores**. Mostre o selo verde "Selo de confiança" nos cards.
2. Clique no selo: aparece o porquê (e-mail confirmado, ao menos uma Avaliação verificada, média das verificadas de 4,0 ou mais).
3. Abra o Perfil de **Bruno Cavalcanti**: selo no topo. Explique que o selo é calculado, nunca dado à mão, e some sozinho se o Prestador deixar de cumprir um critério.

## 2. Prestador VIP (Rogério e Esdras, ~1,5 min)
1. Em **Buscar**, filtre **Tipo de serviço: Landing Page**. No topo aparece a faixa **Destaque VIP** com até 3 Prestadores VIP que atendem ao filtro; a lista abaixo não muda de ordem.
2. Mostre o selo VIP no Perfil de Bruno Cavalcanti.
3. Entre como **prestador1@demo.example** (Aurora Web Studio, não é VIP) → painel → **VIP**: benefícios, aviso "Nesta versão não há assinatura nem cobrança" e o botão **Tenho interesse**. Clique: fica registrado com a data.
4. Explique a decisão (ADR 0004): a plataforma concede o VIP; o interesse mede a demanda sem prometer cobrança. A Triagem continua neutra.
5. Saia e entre como **plataforma@demo.example** (Equipe da plataforma) → menu da conta → **Plataforma**. Em "Pediram o VIP" aparecem Clara Medeiros, Henrique Batista e, agora, Aurora Web Studio com a data do pedido. Clique **Conceder VIP** na Aurora: ela passa para "VIP agora" e o selo VIP aparece no Perfil dela. Para quem não é da Equipe, `/plataforma` responde 404 (ADR 0005).

## 3. Filtros de Oportunidades (Messias, ~1,5 min, ainda como prestador1)
1. Painel → **Oportunidades**. Abra **Filtros**.
2. Marque **Situação: Fui convidado** e **Prazo desejado até 7 dias**: sobra a "Página rápida para evento de música".
3. Limpe e use **Orçamento a partir de R$ 1.500**: Projetos com orçamento "não sei" continuam aparecendo, marcados.
4. Mostre que os filtros ficam no endereço da página (dá para voltar e compartilhar).
5. Explique a mudança desde a daily de 18/11: tecnologias, modalidade e nível foram descartados porque o Cliente leigo não sabe informar a stack, modalidade não faz sentido para freelancer e orçamento e prazo já dizem o porte. Os filtros usam o que o Projeto já tem.

## 3b. Avisos (extra, ~1 min)
1. Entre como **prestador1@demo.example**: o **sino** no topo mostra quantos Avisos não lidos há (Convites recebidos, Proposta pré-selecionada, aceita ou recusada).
2. Clique no sino → **Avisos**. Abra o Aviso de Convite: ele leva à Oportunidade e deixa de contar como não lido.
3. Como **cliente1@demo.example**, o sino mostra as Propostas recebidas nos seus Projetos.
4. Explique: o Aviso é gravado junto com a ação (se a ação falha, não há Aviso solto) e fica só dentro do site, sem e-mail.

## 4. Preço de mercado externo com Firecrawl (Caio, ~2 min, visitante)
1. **Triagem** → "Preciso de um site para minha empresa" → **Site institucional**; preencha e veja o resultado.
2. Abaixo do Preço de referência aparece **Preço de mercado externo**: uma linha por fonte (Cronoshare, Hostinger, Nuvemshop), com faixa, link, data da coleta e o trecho da página.
3. Explique: o Firecrawl lê as páginas toda segunda-feira e extrai a faixa com um schema JSON; o valor só é gravado se aparecer no trecho citado. Fica separado do Preço de referência, que continua sendo só o mercado da plataforma.
4. Volte e escolha "Preciso de uma API para meu aplicativo" → **API**: "Ainda não há preço externo para este Tipo de serviço" (sem fonte pública confiável em reais).

## 5. Versão e-commerce com WooCommerce (~2 min, visitante)
Endereço: https://propostadev.caiomayan.com (ADR 0006). Mesma identidade do site.
1. Página inicial: o painel lima **O que você precisa?** leva direto a cada Tipo de serviço; abaixo, **Destaque VIP**, **Como funciona a contratação** e **Mais bem avaliados**.
2. Clique em **Landing Page** no painel: o catálogo filtra pelo Tipo (os botões no topo trocam o filtro). Cada card mostra o Prestador, a nota, o prazo e o preço com unidade.
3. Abra **Landing Page de lançamento** (Bruno Cavalcanti, VIP): ficha do Prestador com link para o Perfil no site, preço, prazo e as abas **O que está incluído**, **Sobre o Prestador** e **Avaliações**.
4. **Contratar** leva ao **Carrinho** → **Ir para a Contratação**: nome, e-mail e **Descreva seu Projeto** (obrigatório; sem endereço, porque nada é entregue nem cobrado) e "Combinar pagamento com o Prestador". **Confirmar Contratação** mostra a Contratação recebida, que chega ao Prestador com o Projeto e o contato do Cliente.
5. **Regras de negócio** (o **Entrar** fica no cabeçalho; senha das contas demo):
   - Entre como **cliente1@demo.example** (Mariana Costa) → **Minhas Contratações**: uma *Aguardando o Prestador* (Bruno Cavalcanti) e uma *Concluída* (Aurora Web Studio), com as respostas do Prestador.
   - Saia e entre como **prestador2@demo.example** (Bruno) → **Contratações recebidas**: a Contratação da Mariana com a descrição do Projeto. **Confirmar escopo** e depois **Marcar como concluída**. Outro Prestador não vê essa Contratação, e Prestador não entra no `/wp-admin`.
   - Volte como Mariana e abra a Oferta do Bruno → aba **Avaliações**: agora o formulário aparece; a Avaliação sai com o selo **Contratação verificada**. Quem não contratou vê o aviso de que só quem teve a Contratação concluída avalia.
   - Tente pôr no carrinho Ofertas de dois Prestadores: a loja recusa (uma Contratação é com um Prestador por vez, como a Proposta no site).
6. Mostre também uma Oferta **sob consulta** (Site institucional sob medida, Maré Sistemas): não vai para o carrinho, o botão pede orçamento no site.
7. Explique o mapeamento: Oferta vira produto, Tipo de serviço vira categoria, Prestador vira marca (tem página própria), Avaliação do Prestador aparece no produto. Triagem, Preço de referência, Projetos e Propostas ficam só na plataforma própria: é o que uma loja pronta não faz, e a loja manda para lá quando o Cliente não sabe o que precisa.

Depois do ensaio, volte a loja ao ponto de partida com o reset de `ecommerce/README.md` (apaga as Contratações e Avaliações feitas no ensaio e recria as duas de exemplo).

## Perguntas prováveis
- *O VIP é pago?* Nesta versão não: só registra interesse. Cobrança exige decisões de produto e jurídicas próprias.
- *Por que não misturar o preço externo na média?* Porque o Preço de referência promete mostrar o mercado da plataforma, com o tamanho da amostra; misturar esconderia a origem do número.
- *Por que WooCommerce?* É gratuito, é a plataforma de e-commerce mais usada e é configurável por linha de comando, então a loja inteira se recria a partir do repositório. Shopify e Nuvemshop exigem conta, e o Shopify cobra depois do teste.
- *E se uma fonte mudar ou sair do ar?* A coleta grava FALHA e a tela continua mostrando o último valor válido, com a data.

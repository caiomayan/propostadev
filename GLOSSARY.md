# Proposta.dev

Diretório onde clientes descrevem o que precisam, entendem quanto costuma custar e encontram prestadores de desenvolvimento de software para contratar fora da plataforma.

## Contas

**Usuário**:
Pessoa autenticável na plataforma; tem exatamente um tipo de conta.
_Evitar_: membro, login

**Tipo de conta**:
Cliente ou Prestador, escolhido no início e imutável.
_Evitar_: cargo, perfil (para designar tipo)

**Cliente**:
Usuário que publica Projetos, faz a triagem das Propostas e avalia Prestadores que contratou.
_Evitar_: contratante, comprador

**Prestador**:
Usuário que mantém um Perfil público PF ou PJ, publica Ofertas e envia Propostas.
_Evitar_: freelancer, fornecedor

**Perfil**:
Vitrine pública de um Prestador: dados, contatos, Ofertas e Avaliações.

## Catálogo

**Categoria**:
Agrupamento simples do catálogo, como Desenvolvimento Web.

**Tipo de serviço**:
Item padronizado do catálogo, como Landing Page.
_Evitar_: serviço (sozinho), produto

**Oferta**:
Anúncio de um Prestador para um Tipo de serviço, com preço e prazo próprios.
_Evitar_: serviço, anúncio genérico

**Oferta pausada**:
Oferta que continua no painel do dono, mas some dos resultados públicos.

**Ativo**:
Publicável e elegível para busca; exige Perfil válido e ativo.

## Triagem

**Projeto**:
Necessidade descrita por um Cliente: Tipo de serviço, objetivo, orçamento e prazo desejado.
_Evitar_: demanda, pedido, job, solicitação

**Triagem**:
Fluxo guiado em que o Cliente descreve seu Projeto e recebe o Preço de referência e os Prestadores compatíveis.
_Evitar_: filtro, matching

**Preço de referência**:
O que o mercado da plataforma anuncia para um Tipo de serviço: a média dos preços fixos e a faixa de preços anunciados, sempre com o tamanho da amostra; não é orçamento.
_Evitar_: preço justo, estimativa, orçamento

**Prestador compatível**:
Prestador com Oferta ativa no Tipo de serviço do Projeto, listado com os motivos explícitos da compatibilidade.
_Evitar_: recomendado, match

**Convite**:
Chamado de um Cliente para que um Prestador compatível envie Proposta a um Projeto.

**Proposta**:
Resposta de um Prestador a um Projeto aberto, com valor, prazo e mensagem.
_Evitar_: orçamento, lance, bid

**Pré-seleção**:
Marca do Cliente nas Propostas que continuam na disputa.
_Evitar_: favorito, shortlist

**Aceite**:
Escolha de uma Proposta pelo Cliente; encerra o Projeto e libera os contatos dos dois lados. Não é contrato nem pagamento.
_Evitar_: contratação, fechamento de contrato

## Reputação

**Avaliação**:
Nota de 1 a 5 e comentário de um Cliente sobre um Prestador.

**Avaliação verificada**:
Avaliação feita por Cliente que teve Proposta aceita daquele Prestador. É derivada (não há coluna): existe Proposta ACEITA do autor com o Prestador. Aparece com o selo "Contratado pela Proposta.dev". As do MVP 1 sem esse Aceite aparecem como "Avaliação anterior, sem contratação verificada".
_Evitar_: avaliação confirmada

**Comparação**:
Seleção local de até três Prestadores para confrontar dados.

**Preço anunciado médio**:
Média dos preços fixos de Ofertas elegíveis de um Tipo de serviço; parte do Preço de referência.

**Contato**:
Acesso voluntário a e-mail, telefone ou link; a negociação ocorre fora da plataforma.

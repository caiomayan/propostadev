# Roteiro da apresentação: MVP 3 (Sprint 4 Review, 25/11/2026)

Endereço: https://propostadev-one.vercel.app. Dados da demo são fictícios (nomes com "— Demo"). Senha das contas demo: a combinada com a equipe, fora do repositório.

## 1. Selo de confiança (Erick, ~1 min, visitante)
1. Abra **Buscar desenvolvedores**. Mostre o selo verde "Selo de confiança" nos cards.
2. Clique no selo: aparece o porquê (e-mail confirmado, ao menos uma Avaliação verificada, média das verificadas de 4,0 ou mais).
3. Abra o Perfil de **Horizonte Digital — Demo**: selo no topo. Explique que o selo é calculado, nunca dado à mão, e some sozinho se o Prestador deixar de cumprir um critério.

## 2. Prestador VIP (Rogério e Esdras, ~1,5 min)
1. Em **Buscar**, filtre **Tipo de serviço: Landing Page**. No topo aparece a faixa **Destaque VIP** com até 3 Prestadores VIP que atendem ao filtro; a lista abaixo não muda de ordem.
2. Mostre o selo VIP no Perfil de Horizonte Digital.
3. Entre como **prestador1@demo.example** (Aurora Web, não é VIP) → painel → **VIP**: benefícios, aviso "Nesta versão não há assinatura nem cobrança" e o botão **Tenho interesse**. Clique: fica registrado com a data.
4. Explique a decisão (ADR 0004): a plataforma concede o VIP; o interesse mede a demanda sem prometer cobrança. A Triagem continua neutra.

## 3. Filtros de Oportunidades (Messias, ~1,5 min, ainda como prestador1)
1. Painel → **Oportunidades**. Abra **Filtros**.
2. Marque **Situação: Fui convidado** e **Prazo desejado até 7 dias**: sobra a "Página rápida para evento de música".
3. Limpe e use **Orçamento a partir de R$ 1.500**: Projetos com orçamento "não sei" continuam aparecendo, marcados.
4. Mostre que os filtros ficam no endereço da página (dá para voltar e compartilhar).
5. Explique a mudança desde a daily de 18/11: tecnologias, modalidade e nível foram descartados porque o Cliente leigo não sabe informar a stack, modalidade não faz sentido para freelancer e orçamento e prazo já dizem o porte. Os filtros usam o que o Projeto já tem.

## 4. Preço de mercado externo com Firecrawl (Caio, ~2 min, visitante)
1. **Triagem** → "Quero um site para a minha empresa" (ou Escolher o tipo) → **Site institucional**; preencha e veja o resultado.
2. Abaixo do Preço de referência aparece **Preço de mercado externo**: uma linha por fonte (Cronoshare, Hostinger, Nuvemshop), com faixa, link, data da coleta e o trecho da página.
3. Explique: o Firecrawl lê as páginas toda segunda-feira e extrai a faixa com um schema JSON; o valor só é gravado se aparecer no trecho citado. Fica separado do Preço de referência, que continua sendo só o mercado da plataforma.
4. Mostre **API**: "Ainda não há preço externo para este Tipo de serviço" (sem fonte pública confiável em reais).

## Perguntas prováveis
- *O VIP é pago?* Nesta versão não: só registra interesse. Cobrança exige decisões de produto e jurídicas próprias.
- *Por que não misturar o preço externo na média?* Porque o Preço de referência promete mostrar o mercado da plataforma, com o tamanho da amostra; misturar esconderia a origem do número.
- *E se uma fonte mudar ou sair do ar?* A coleta grava FALHA e a tela continua mostrando o último valor válido, com a data.

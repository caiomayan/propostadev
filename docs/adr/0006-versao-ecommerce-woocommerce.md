# 0006 — Versão e-commerce: WooCommerce na VM do dono, com as Ofertas como produtos

Data: 25/11/2026. Pedido do dono para a Review da Sprint 4 (12h30): além do site, entregar o projeto implementado numa plataforma de e-commerce, sem todas as funcionalidades do site, mas no mesmo caminho. A escolha da plataforma foi delegada ao coordenador.

## Contexto

O site (Next.js) é a versão própria da plataforma. A disciplina pede também a versão sobre uma plataforma de e-commerce pronta. O prazo era a mesma manhã, a implementação seria feita pelo agente, e não havia conta em nenhuma plataforma.

## Decisões

1. **WooCommerce (WordPress), auto-hospedado.** Alternativas: Shopify e Nuvemshop (exigem cadastro do dono, e o Shopify cobra depois do teste), Vercel (não roda WordPress: precisa de PHP, MySQL e disco persistente). O WooCommerce é gratuito, é a plataforma de e-commerce mais usada e é instalável e configurável inteiro por linha de comando (WP-CLI), então a loja é reproduzível a partir do repositório.
2. **Hospedagem na VM Oracle do dono, em Docker Compose separado do Carmine, publicada em `propostadev.caiomayan.com` por uma rota a mais no túnel da Cloudflare que já roda na VM (`caiomayan-vm`, serviço do sistema), apontando para `127.0.0.1:8090`.** As portas 80/443 da VM não estão abertas para a internet; o Carmine já sai por esse túnel, e as rotas dele não mudaram. A loja tem rede, volumes e túnel próprios e limite de memória (768 MB no WordPress). Fica fora do Coolify por enquanto (prazo); o mesmo `ecommerce/compose.yml` pode ser importado no Coolify depois.
3. **Mapeamento do domínio para o WooCommerce:**
   - Oferta → produto virtual (sem frete), vendido um por pedido; Oferta por hora aceita quantidade de horas.
   - Categoria > Tipo de serviço → categorias de produto (com hierarquia).
   - Prestador → marca do produto (taxonomia de marcas do WooCommerce), com a descrição do Perfil e link para o Perfil no site.
   - Avaliação do Prestador → avaliação em cada produto dele (a Avaliação no site é do Prestador, não da Oferta).
   - Prestador VIP → produto em destaque ("Destaque VIP" na página inicial).
   - Preço: fixo, "a partir de", intervalo (o pedido reserva o valor inicial e o Prestador confirma o final), por hora, e "sob consulta" (não vai para o carrinho; o botão leva ao Perfil no site).
   - Contratação → pedido, com pagamento "Combinar pagamento com o Prestador": nenhum gateway real e nenhuma cobrança.
4. **Regras de negócio no próprio WooCommerce, sem plugin de marketplace pago** (pedido do dono depois da primeira versão):
   - Contratação tem os status do domínio: Aguardando o Prestador → Escopo confirmado → Concluída, ou Recusada pelo Prestador. Só "Concluída" conta como paga.
   - Uma Contratação é com um Prestador por vez (o carrinho recusa misturar), como a Proposta no site.
   - Cada Prestador da demo tem conta (papel `prestador`, mesma senha das contas demo do site) e vê só as Contratações das suas Ofertas em "Contratações recebidas", onde confirma, recusa ou conclui. O servidor confere sessão, nonce, dono e transição permitida.
   - Em "Minhas Ofertas" o Prestador cria, edita, pausa e reativa as próprias Ofertas, com as mesmas regras do formulário do site (`src/modules/offers/validation.ts`) e uma Oferta ativa por Tipo de serviço, validadas no servidor. Alternativa descartada: plugin de marketplace (Dokan, WCFM), que traz o modelo de vendedor de produto físico (estoque, frete, repasse, comissão) e não o de Oferta de serviço.
   - O cadastro de Prestador (Perfil, PF/PJ, contatos, Selo de confiança) fica só na plataforma: a loja é um canal de venda das Ofertas e não mantém um segundo cadastro do mesmo Prestador. A tela de login da loja manda quem quer oferecer serviços para o cadastro no Proposta.dev.
   - Cliente cria conta na loja ou na Contratação e acompanha status e respostas em "Minhas Contratações".
   - Só quem teve a Contratação concluída avalia; a Avaliação sai com o selo "Contratação verificada" e é publicada direto.
   - Sem e-mail: os avisos ficam na conta (os endereços da demo não entregam). Por isso a loja não oferece recuperação de senha nem verificação de e-mail.
   - A Contratação usa o checkout clássico do WooCommerce, não o de blocos: só nele os campos são configuráveis em PHP. Pede nome, e-mail, telefone opcional e a descrição do Projeto (obrigatória, é o que o Prestador confirma); não pede endereço, porque nada é entregue nem cobrado.
   - Conta no cabeçalho ("Entrar" ou o menu com nome, papel e Contratações aguardando); o login volta à página de origem, e o Prestador vai direto às Contratações recebidas.
   - Equipe: relatórios do WooCommerce ligados no `/wp-admin`.
5. **O catálogo vem da demo de produção do site**, só Prestadores `@demo.example`, por um script só de leitura (`scripts/exportar-catalogo-loja.ts`). O rodapé da loja repete o aviso de dados fictícios do site (ADR 0005) e acrescenta que nada é cobrado.

## Consequências

- Ficam fora da loja: Triagem, Preço de referência, Projetos e Propostas, Comparação, Selo de confiança, Avisos e o painel da plataforma. São a diferença entre a plataforma própria e a loja pronta.
- Senhas da loja (banco e administrador `equipe`) ficam em `~/.config/propostadev/loja.env` na VM, fora do git.
- Nenhuma credencial nova: a rota e o registro DNS (CNAME com proxy) foram criados pela API da Cloudflare na conta do dono. Para tirar a loja do ar, remover a rota `propostadev.caiomayan.com` do túnel `caiomayan-vm` e o CNAME.

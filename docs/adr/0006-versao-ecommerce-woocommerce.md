# 0006 — Versão e-commerce: WooCommerce na VM do dono, com as Ofertas como produtos

Data: 25/11/2026. Pedido do dono para a Review da Sprint 4 (12h30): além do site, entregar o projeto implementado numa plataforma de e-commerce, sem todas as funcionalidades do site, mas no mesmo caminho. A escolha da plataforma foi delegada ao coordenador.

## Contexto

O site (Next.js) é a versão própria da plataforma. A disciplina pede também a versão sobre uma plataforma de e-commerce pronta. O prazo era a mesma manhã, a implementação seria feita pelo agente, e não havia conta em nenhuma plataforma.

## Decisões

1. **WooCommerce (WordPress), auto-hospedado.** Alternativas: Shopify e Nuvemshop (exigem cadastro do dono, e o Shopify cobra depois do teste), Vercel (não roda WordPress: precisa de PHP, MySQL e disco persistente). O WooCommerce é gratuito, é a plataforma de e-commerce mais usada e é instalável e configurável inteiro por linha de comando (WP-CLI), então a loja é reproduzível a partir do repositório.
2. **Hospedagem na VM Oracle do dono, em Docker Compose separado do Carmine, publicada por túnel da Cloudflare em `propostadev.caiomayan.com`.** As portas 80/443 da VM não estão abertas para a internet; o Carmine já sai por túnel. A loja tem rede, volumes e túnel próprios e limite de memória (768 MB no WordPress). Fica fora do Coolify por enquanto (prazo); o mesmo `ecommerce/compose.yml` pode ser importado no Coolify depois.
3. **Mapeamento do domínio para o WooCommerce:**
   - Oferta → produto virtual (sem frete), vendido um por pedido; Oferta por hora aceita quantidade de horas.
   - Categoria > Tipo de serviço → categorias de produto (com hierarquia).
   - Prestador → marca do produto (taxonomia de marcas do WooCommerce), com a descrição do Perfil e link para o Perfil no site.
   - Avaliação do Prestador → avaliação em cada produto dele (a Avaliação no site é do Prestador, não da Oferta).
   - Prestador VIP → produto em destaque ("Destaque VIP" na página inicial).
   - Preço: fixo, "a partir de", intervalo (o pedido reserva o valor inicial e o Prestador confirma o final), por hora, e "sob consulta" (não vai para o carrinho; o botão leva ao Perfil no site).
   - Contratação → pedido, com pagamento "Combinar pagamento com o Prestador": nenhum gateway real e nenhuma cobrança.
4. **O catálogo vem da demo de produção do site**, só Prestadores `@demo.example`, por um script só de leitura (`scripts/exportar-catalogo-loja.ts`). O rodapé da loja repete o aviso de dados fictícios do site (ADR 0005) e acrescenta que nada é cobrado.

## Consequências

- Ficam fora da loja: Triagem, Preço de referência, Projetos e Propostas, Comparação, Selo de confiança, Avisos e o painel da plataforma. São a diferença entre a plataforma própria e a loja pronta.
- Senhas da loja (banco e administrador `equipe`) ficam em `~/.config/propostadev/loja.env` na VM, fora do git.
- Um contêiner `cloudflared` próprio, com credencial de túnel em `~/.cloudflared` da VM.

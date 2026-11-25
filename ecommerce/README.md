# Proposta.dev — versão e-commerce (WooCommerce)

Loja em https://propostadev.caiomayan.com. Decisões e mapeamento do domínio: [ADR 0006](../docs/adr/0006-versao-ecommerce-woocommerce.md).

O que a loja faz: catálogo das Ofertas dos Prestadores da demo, filtrado por categoria e Tipo de serviço, com busca; página do serviço com Prestador, prazo, preço conforme o tipo e Avaliações; "Destaque VIP" na página inicial; carrinho e Contratação (checkout) com pagamento combinado com o Prestador, sem cobrança. O administrador vê as Contratações em WooCommerce → Pedidos.

## Rodar (na VM, da raiz do repositório)

```sh
ENV=~/.config/propostadev/loja.env                    # senhas do banco e do administrador; LOJA_URL para o endereço público
docker compose --env-file $ENV -f ecommerce/compose.yml up -d                         # banco + WordPress (local: http://localhost:8090)
docker compose --env-file $ENV -f ecommerce/compose.yml run --rm cli sh /seed/instalar.sh  # instala e configura tudo; pode repetir
docker compose --env-file $ENV -f ecommerce/compose.yml --profile publico up -d tunnel    # publica pelo túnel da Cloudflare
```

## Atualizar o catálogo

1. Exportar da demo (só leitura): `pnpm exec tsx --conditions=react-server scripts/exportar-catalogo-loja.ts` com a `DATABASE_URL` desejada. Gera `ecommerce/seed/catalogo.json`.
2. Capas por Tipo de serviço: `node ecommerce/gerar-capas.mjs`.
3. Rodar `instalar.sh` de novo: atualiza os produtos existentes (pela Oferta de origem) e cria os novos.

## Administração

Login em `/wp-admin` com o usuário `equipe` e a senha `LOJA_ADMIN_PASSWORD` de `loja.env`.

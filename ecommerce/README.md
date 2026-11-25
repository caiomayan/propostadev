# Proposta.dev — versão e-commerce (WooCommerce)

Loja em https://propostadev.caiomayan.com. Decisões e mapeamento do domínio: [ADR 0006](../docs/adr/0006-versao-ecommerce-woocommerce.md).

O que a loja faz: catálogo das Ofertas dos Prestadores da demo, filtrado por categoria e Tipo de serviço, com busca; página do serviço com Prestador, prazo, preço conforme o tipo e Avaliações; "Destaque VIP" na página inicial; carrinho e Contratação (checkout) com pagamento combinado com o Prestador, sem cobrança. O administrador vê as Contratações em WooCommerce → Pedidos.

## Rodar (na VM, da raiz do repositório)

```sh
ENV=~/.config/propostadev/loja.env                    # senhas do banco e do administrador; LOJA_URL=https://propostadev.caiomayan.com
docker compose --env-file $ENV -f ecommerce/compose.yml up -d                         # banco + WordPress (local: http://localhost:8090)
docker compose --env-file $ENV -f ecommerce/compose.yml run --rm cli sh /seed/instalar.sh  # instala e configura tudo; pode repetir
```

O endereço público é uma rota do túnel da Cloudflare `caiomayan-vm` (já rodando na VM) para `127.0.0.1:8090`, com CNAME `propostadev` na zona caiomayan.com.

## Atualizar o catálogo

1. Exportar da demo (só leitura): `pnpm exec tsx --conditions=react-server scripts/exportar-catalogo-loja.ts` com a `DATABASE_URL` desejada. Gera `ecommerce/seed/catalogo.json`.
2. Capas (uma por Oferta, com o avatar do Prestador, e uma por Tipo de serviço para as categorias): `node ecommerce/gerar-capas.mjs`.
3. Rodar `instalar.sh` de novo: atualiza os produtos existentes (pela Oferta de origem) e cria os novos.

## Contas da demo e reset

- Prestadores: `prestadorN@demo.example`; Cliente: `cliente1@demo.example` (Mariana Costa). Senha: a das contas demo do site (`DEMO_PASSWORD`).
- Duas Contratações de exemplo da Mariana: uma aguardando o Bruno Cavalcanti (`prestador2`) e uma concluída com a Aurora Web Studio (`prestador1`), que libera a Avaliação verificada.
- Voltar a loja ao ponto de partida (apaga Contratações e Avaliações feitas na loja e recria as de exemplo):

```sh
set -a; . ~/.config/propostadev/producao.env; set +a; export DEMO_PASSWORD
docker compose --env-file ~/.config/propostadev/loja.env -f ecommerce/compose.yml run --rm -e DEMO_PASSWORD -e PD_RESET=1 cli wp eval-file /seed/demo.php
```

## Login com Google (login único com o Proposta.dev)

O botão "Continuar com Google" leva a `/api/loja/entrar` no site, que faz o login (Google ou e-mail) e devolve um token HMAC de 2 minutos e uso único. A loja confere com `LOJA_SSO_SECRET` (o mesmo valor na Vercel e em `loja.env`) e entra na conta com aquele e-mail, criando uma conta de Cliente no primeiro acesso. Só e-mails verificados no site entram. O botão aparece com `wp option update pd_sso_ativo yes` (depois de a rota do site estar em produção).

## Administração

Login em `/wp-admin` com o usuário `equipe` e a senha `LOJA_ADMIN_PASSWORD` de `loja.env`.

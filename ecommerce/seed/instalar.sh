#!/bin/sh
# Instala e configura a loja WooCommerce do Proposta.dev (ADR 0006). Idempotente: pode rodar de novo.
# Rodar (da raiz do repo):
#   docker compose --env-file ~/.config/propostadev/loja.env -f ecommerce/compose.yml run --rm cli sh /seed/instalar.sh
set -eu
cd /var/www/html
URL="${LOJA_URL:-http://localhost:8090}"

if ! wp core is-installed 2>/dev/null; then
  wp core install --url="$URL" --title="Proposta.dev" --admin_user=equipe --admin_password="$LOJA_ADMIN_PASSWORD" \
    --admin_email=equipe@propostadev.example --skip-email
fi

# WooCommerce atual exige o WordPress mais recente.
wp core update
wp core update-db

# Idioma, fuso e textos do site.
wp language core install pt_BR --activate
wp option update timezone_string America/Sao_Paulo
wp option update date_format 'd/m/Y'
wp option update blogdescription 'Serviços de desenvolvimento com preço e prazo claros'
wp rewrite structure '/%postname%/' --hard
wp plugin delete hello akismet 2>/dev/null || true
wp post delete 1 2 3 --force 2>/dev/null || true

# WooCommerce e tema.
wp plugin install woocommerce --activate
wp theme install storefront --activate
wp language plugin install woocommerce pt_BR || true
wp language theme install storefront pt_BR || true
wp theme delete twentytwentythree twentytwentyfour twentytwentyfive 2>/dev/null || true
mkdir -p wp-content/mu-plugins && cp /seed/mu-plugin/propostadev.php /seed/mu-plugin/propostadev-negocio.php /seed/mu-plugin/propostadev.css wp-content/mu-plugins/
wp wc tool run install_pages --user=equipe >/dev/null

# Loja no Brasil, em reais, sem frete nem imposto (serviços digitais), aberta ao público.
for kv in \
  woocommerce_default_country=BR:SP woocommerce_currency=BRL woocommerce_currency_pos=left_space \
  woocommerce_price_thousand_sep=. woocommerce_price_decimal_sep=, woocommerce_price_num_decimals=2 \
  woocommerce_allowed_countries=specific woocommerce_ship_to_countries=disabled woocommerce_calc_taxes=no \
  woocommerce_coming_soon=no woocommerce_store_pages_only=no woocommerce_enable_guest_checkout=yes \
  woocommerce_enable_reviews=yes woocommerce_review_rating_verification_required=yes woocommerce_enable_review_rating=yes \
  woocommerce_task_list_hidden=yes woocommerce_extended_task_list_hidden=yes woocommerce_show_marketplace_suggestions=no \
  woocommerce_allow_tracking=no woocommerce_enable_coupons=no \
  woocommerce_enable_myaccount_registration=yes woocommerce_enable_signup_and_login_from_checkout=yes woocommerce_enable_checkout_login_reminder=yes \
  woocommerce_registration_generate_password=no woocommerce_registration_generate_username=yes woocommerce_review_rating_required=yes woocommerce_cart_redirect_after_add=yes woocommerce_enable_ajax_add_to_cart=no woocommerce_analytics_enabled=yes woocommerce_feature_order_attribution_enabled=no; do
  wp option update "${kv%%=*}" "${kv#*=}" >/dev/null 2>&1 || true
done
wp option update woocommerce_specific_allowed_countries '["BR"]' --format=json >/dev/null
wp option update woocommerce_permalinks '{"product_base":"servico","category_base":"categoria","tag_base":"etiqueta"}' --format=json >/dev/null
wp option update woocommerce_brand_permalink prestador >/dev/null
wp option update woocommerce_onboarding_profile '{"skipped":true}' --format=json >/dev/null

# Pagamento: só o combinado com o Prestador (demonstração, nada é cobrado).
wp option update woocommerce_cod_settings '{"enabled":"yes","title":"Combinar pagamento com o Prestador","description":"Demonstração: nenhum valor é cobrado agora. O Prestador recebe a Contratação, confirma o escopo e combina o pagamento com você.","instructions":"","enable_for_methods":[],"enable_for_virtual":"yes"}' --format=json >/dev/null
for g in bacs cheque paypal; do wp option update "woocommerce_${g}_settings" '{"enabled":"no"}' --format=json >/dev/null; done

# Catálogo.
wp eval-file /seed/importar.php

# Página inicial (modelo de vitrine do Storefront) e menu.
HOME_ID=$(wp post list --post_type=page --name=inicio --field=ID)
if [ -z "$HOME_ID" ]; then
  HOME_ID=$(wp post create --post_type=page --post_status=publish --post_title='Contrate desenvolvimento com preço e prazo claros' --post_name=inicio \
    --post_content='<p>Escolha uma Oferta de um Prestador, veja preço, prazo e Avaliações, e contrate. O Prestador confirma o escopo e combina o pagamento com você.</p><p><a class="button" href="/loja/">Ver todos os serviços</a></p>' --porcelain)
fi
wp post meta update "$HOME_ID" _wp_page_template template-homepage.php >/dev/null
wp option update show_on_front page >/dev/null
wp option update page_on_front "$HOME_ID" >/dev/null
SHOP_ID=$(wp option get woocommerce_shop_page_id)
wp post update "$SHOP_ID" --post_title='Serviços' --post_name=loja >/dev/null
wp post update "$(wp option get woocommerce_cart_page_id)" --post_title='Carrinho' --post_name=carrinho >/dev/null
wp post update "$(wp option get woocommerce_checkout_page_id)" --post_title='Contratação' --post_name=finalizar-compra >/dev/null
wp post update "$(wp option get woocommerce_myaccount_page_id)" --post_title='Minha conta' --post_name=minha-conta >/dev/null
wp term update product_cat "$(wp option get default_product_cat)" --name='Outros serviços' --slug=outros-servicos >/dev/null

if ! wp menu list --fields=slug --format=csv | grep -q '^principal$'; then
  wp menu create Principal >/dev/null
  wp menu item add-post principal "$SHOP_ID" --title='Serviços' >/dev/null
  for slug in web backend-e-apis manutencao-e-integracoes; do
    TERM_ID=$(wp term get product_cat "$slug" --by=slug --field=term_id 2>/dev/null || true)
    [ -n "$TERM_ID" ] && wp menu item add-term principal product_cat "$TERM_ID" >/dev/null
  done
  wp menu location assign principal primary
fi
wp eval-file /seed/textos.php
wp eval-file /seed/checkout-classico.php
wp eval-file /seed/termos.php
wp eval-file /seed/demo.php
wp rewrite flush >/dev/null 2>&1 || true
wp cache flush >/dev/null
echo "Loja pronta em $URL"

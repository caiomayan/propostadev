<?php
/**
 * Plugin Name: Proposta.dev na loja
 * Description: Identidade visual e regras do Proposta.dev sobre o WooCommerce (ADR 0006): preço e prazo das Ofertas, Prestador no produto, aviso de demonstração.
 */

if (!defined('ABSPATH')) exit;

const PROPOSTADEV_SITE = 'https://propostadev-one.vercel.app';

// Tipografia e cores do site (Bricolage Grotesque + Figtree; verde-floresta, creme e lima).
add_action('wp_enqueue_scripts', function () {
  wp_enqueue_style('propostadev-fontes', 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Figtree:wght@400;500;600;700&display=swap', [], null);
  wp_add_inline_style('storefront-style', propostadev_css());
}, 20);

function propostadev_css(): string {
  return <<<CSS
:root{--pd-bg:#f1f3ec;--pd-card:#fafbf6;--pd-ink:#10231a;--pd-muted:#46574d;--pd-line:#c9d1c0;--pd-forest:#0f3d2e;--pd-lime:#d4f25a}
body{background:var(--pd-bg);color:var(--pd-ink);font-family:Figtree,system-ui,sans-serif}
h1,h2,h3,h4,.site-title,.product_title,.woocommerce-loop-product__title,.storefront-product-section .section-title{font-family:'Bricolage Grotesque',system-ui,sans-serif;letter-spacing:-.03em;color:var(--pd-ink)}
.site-header{background:var(--pd-bg);border-bottom:1px solid var(--pd-line);padding-top:1.2em}
.site-branding .site-title a{color:var(--pd-ink);font-weight:800;font-size:1.6rem;display:inline-flex;align-items:center;gap:10px}
.site-branding .site-title a::before{content:"";width:28px;height:28px;flex:none;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 28'%3E%3Crect fill='%2310231a' x='0' y='4' width='28' height='20' rx='6'/%3E%3Crect fill='%23d4f25a' x='8' y='9' width='12' height='10' rx='3'/%3E%3C/svg%3E") center/contain no-repeat}
.site-branding .site-description{color:var(--pd-muted)}
.main-navigation ul li a,.site-header-cart .cart-contents{color:var(--pd-ink)}
.storefront-primary-navigation,.main-navigation ul.menu ul{background:var(--pd-bg)}
a{color:var(--pd-forest)}
button,.button,input[type=submit],.added_to_cart,.wc-block-components-button:not(.is-link){background:var(--pd-forest)!important;color:#f1f3ec!important;border-radius:999px!important;font-weight:600}
button:hover,.button:hover,input[type=submit]:hover{background:#174a39!important}
.single-product div.product form.cart .button,.single_add_to_cart_button{background:var(--pd-lime)!important;color:var(--pd-ink)!important}
ul.products li.product{background:var(--pd-card);border:1px solid var(--pd-line);border-radius:20px;padding:12px 12px 18px}
ul.products li.product img{border-radius:12px}
ul.products li.product .price,.single-product .summary .price{color:var(--pd-forest);font-weight:700}
.onsale,.pd-vip{background:var(--pd-lime);color:var(--pd-ink);border:0;border-radius:999px;font-weight:700;padding:.2em .8em;font-size:.8em;display:inline-block}
.pd-prestador{display:inline-block;margin:.2em 0 .4em;color:var(--pd-muted);font-size:.9em}
.pd-ficha{background:var(--pd-card);border:1px solid var(--pd-line);border-radius:20px;padding:1.2em 1.4em;margin:1.2em 0}
.pd-ficha dt{font-weight:600;color:var(--pd-muted);font-size:.85em;margin:0}
.pd-ficha dd{margin:0 0 .8em}
.pd-nota{font-size:.85em;color:var(--pd-muted)}
.site-footer{background:var(--pd-forest);color:#bccabf}
.site-footer a,.site-footer .site-info a{color:#f1f3ec}
.pd-demo{display:block;margin-top:.6em;font-size:.85em}
.woocommerce-breadcrumb{background:transparent}
.storefront-handheld-footer-bar{display:none}
.star-rating span::before,.star-rating::before,p.stars a,p.stars a::before{color:var(--pd-forest)!important}
a,.woocommerce-tabs ul.tabs li.active a{color:var(--pd-forest)}
.site-header{background:var(--pd-bg)!important}
.woocommerce-product-gallery,.woocommerce-product-gallery .woocommerce-product-gallery__image img{opacity:1!important}
.site-footer .site-info + .site-info{display:none}
CSS;
}

// Preço conforme o tipo de preço da Oferta no site.
add_filter('woocommerce_get_price_html', function ($html, $product) {
  $type = $product->get_meta('_pd_tipo_preco');
  $min = $product->get_meta('_pd_preco_minimo');
  $max = $product->get_meta('_pd_preco_maximo');
  if (!$type) return $html;
  switch ($type) {
    case 'A_PARTIR_DE': return 'a partir de ' . wc_price($min);
    case 'INTERVALO': return wc_price($min) . ' a ' . wc_price($max);
    case 'POR_HORA': return wc_price($min) . ' <small>por hora</small>';
    case 'SOB_CONSULTA': return '<span class="pd-nota">Preço sob consulta</span>';
  }
  return $html;
}, 10, 2);

function propostadev_prazo(WC_Product $product): string {
  $type = $product->get_meta('_pd_tipo_prazo');
  $min = (int) $product->get_meta('_pd_prazo_minimo');
  $max = (int) $product->get_meta('_pd_prazo_maximo');
  $dias = fn ($n) => $n . ($n === 1 ? ' dia' : ' dias');
  return match ($type) {
    'FIXO' => $dias($min),
    'A_PARTIR_DE' => 'a partir de ' . $dias($min),
    'INTERVALO' => "$min a " . $dias($max),
    default => 'a combinar',
  };
}

// Oferta sob consulta não vai para o carrinho: o Cliente pede orçamento no site.
add_filter('woocommerce_is_purchasable', fn ($ok, $product) => $product->get_meta('_pd_tipo_preco') === 'SOB_CONSULTA' ? false : $ok, 10, 2);

add_filter('woocommerce_product_single_add_to_cart_text', fn () => 'Contratar');
add_filter('woocommerce_product_add_to_cart_text', function ($text, $product) {
  if ($product->get_meta('_pd_tipo_preco') === 'SOB_CONSULTA') return 'Ver detalhes';
  return $product->is_purchasable() ? 'Contratar' : $text;
}, 10, 2);

// Nome do Prestador e selo VIP nos cards do catálogo.
add_action('woocommerce_after_shop_loop_item_title', function () {
  global $product;
  $name = $product->get_meta('_pd_prestador');
  if (!$name) return;
  echo '<span class="pd-prestador">por ' . esc_html($name) . '</span>';
  if ($product->get_meta('_pd_vip') === 'sim') echo ' <span class="pd-vip">VIP</span>';
}, 4);

// Ficha da Oferta na página do produto: Prestador, prazo, como funciona a contratação.
add_action('woocommerce_single_product_summary', function () {
  global $product;
  $name = $product->get_meta('_pd_prestador');
  if (!$name) return;
  $slug = $product->get_meta('_pd_prestador_slug');
  $profile = esc_url(PROPOSTADEV_SITE . '/prestadores/' . $slug);
  $vip = $product->get_meta('_pd_vip') === 'sim' ? ' <span class="pd-vip">VIP</span>' : '';
  $local = $product->get_meta('_pd_local');
  $exp = (int) $product->get_meta('_pd_anos');
  echo '<dl class="pd-ficha">';
  echo '<dt>Prestador</dt><dd><strong>' . esc_html($name) . '</strong>' . $vip . '<br><span class="pd-nota">' . esc_html(trim(($local ? $local . ' · ' : '') . ($exp ? $exp . ' anos de experiência' : ''))) . '</span><br><a href="' . $profile . '" target="_blank" rel="noopener">Ver Perfil completo no Proposta.dev</a></dd>';
  echo '<dt>Prazo estimado</dt><dd>' . esc_html(propostadev_prazo($product)) . '</dd>';
  $type = $product->get_meta('_pd_tipo_preco');
  if ($type === 'INTERVALO' || $type === 'A_PARTIR_DE') echo '<dt>Valor</dt><dd class="pd-nota">O pedido reserva o valor inicial; o valor final é confirmado pelo Prestador depois de entender o Projeto.</dd>';
  if ($type === 'POR_HORA') echo '<dt>Valor</dt><dd class="pd-nota">Escolha a quantidade de horas.</dd>';
  if ($type === 'SOB_CONSULTA') echo '<dt>Valor</dt><dd><a class="button" href="' . $profile . '" target="_blank" rel="noopener">Pedir orçamento no Proposta.dev</a></dd>';
  echo '</dl>';
}, 25);

// Contratação: a observação do pedido vira a descrição do Projeto.
add_filter('woocommerce_checkout_fields', function ($fields) {
  if (isset($fields['order']['order_comments'])) {
    $fields['order']['order_comments']['label'] = 'Descreva seu Projeto';
    $fields['order']['order_comments']['placeholder'] = 'O que você precisa, para quando e qualquer referência útil para o Prestador.';
  }
  return $fields;
});

// Rodapé com o mesmo aviso do site (ADR 0005). O crédito do tema sai depois que o tema carrega.
add_action('init', function () { remove_action('storefront_footer', 'storefront_credit', 20); });
add_action('storefront_footer', function () {
  echo '<div class="site-info">© ' . esc_html(date('Y')) . ' Proposta.dev · <a href="' . esc_url(PROPOSTADEV_SITE) . '">Ir para a plataforma</a>';
  echo '<span class="pd-demo">Projeto acadêmico em demonstração: Prestadores, Ofertas e Avaliações exibidos são fictícios, e nenhum pagamento é cobrado.</span></div>';
}, 20);

// Vitrine da página inicial: só o que a demo tem (sem vendas nem promoções ainda), com os nomes do Proposta.dev.
add_action('wp', function () {
  remove_all_actions('homepage');
  add_action('homepage', 'storefront_homepage_content', 10);
  add_action('homepage', 'storefront_featured_products', 20);
  add_action('homepage', 'storefront_product_categories', 30);
  add_action('homepage', 'storefront_popular_products', 40);
  add_action('homepage', 'storefront_recent_products', 50);
  // Página de serviço e de catálogo em largura total, sem a barra lateral de blog nem a navegação lateral entre produtos.
  remove_action('storefront_sidebar', 'storefront_get_sidebar', 10);
  remove_action('woocommerce_after_single_product_summary', 'storefront_single_product_pagination', 30);
});
add_filter('body_class', fn ($c) => array_merge($c, ['storefront-full-width-content']));
add_filter('storefront_featured_products_args', fn ($a) => array_merge($a, ['title' => 'Destaque VIP', 'limit' => 4, 'columns' => 4]));
add_filter('storefront_product_categories_args', fn ($a) => array_merge($a, ['title' => 'Serviços por categoria', 'limit' => 3, 'columns' => 3]));
add_filter('storefront_popular_products_args', fn ($a) => array_merge($a, ['title' => 'Mais bem avaliados', 'limit' => 4, 'columns' => 4]));
add_filter('storefront_recent_products_args', fn ($a) => array_merge($a, ['title' => 'Ofertas recentes', 'limit' => 4, 'columns' => 4]));

// Capa é uma arte fixa: sem zoom (no celular ele mostrava só um pedaço).
add_action('after_setup_theme', fn () => remove_theme_support('wc-product-gallery-zoom'), 99);

// Favicon da marca.
add_action('wp_head', function () {
  echo '<link rel="icon" href="' . esc_url(PROPOSTADEV_SITE . '/icon.svg') . '" type="image/svg+xml">' . "\n";
  echo '<meta name="theme-color" content="#f1f3ec">' . "\n";
});

<?php
/**
 * Plugin Name: Proposta.dev na loja
 * Description: Identidade visual e regras do Proposta.dev sobre o WooCommerce (ADR 0006): cabeçalho e rodapé da marca, vitrine, preço e prazo das Ofertas, Prestador no produto, aviso de demonstração.
 */

if (!defined('ABSPATH')) exit;

const PROPOSTADEV_SITE = 'https://propostadev-one.vercel.app';

/* ---------------------------------------------------------------- Estilos */

add_action('wp_enqueue_scripts', function () {
  wp_enqueue_style('propostadev-fontes', 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Figtree:wght@400;500;600;700&display=swap', [], null);
  wp_register_style('propostadev', false, ['storefront-style', 'storefront-woocommerce-style'], '3');
  wp_enqueue_style('propostadev');
  wp_add_inline_style('propostadev', (string) file_get_contents(__DIR__ . '/propostadev.css'));
  if (function_exists('WC')) wp_enqueue_script('wc-cart-fragments');
}, 30);

add_action('wp_head', function () {
  echo '<link rel="icon" href="' . esc_url(PROPOSTADEV_SITE . '/icon.svg') . '" type="image/svg+xml">' . "\n";
  echo '<link rel="apple-touch-icon" href="' . esc_url(PROPOSTADEV_SITE . '/apple-icon.png') . '">' . "\n";
  echo '<meta name="theme-color" content="#f1f3ec">' . "\n";
});

/* ---------------------------------------------------------------- Peças */

function pd_mark(string $class = 'pd-mark'): string {
  return '<svg class="' . esc_attr($class) . '" viewBox="0 0 28 28" aria-hidden="true" focusable="false"><rect class="pd-mark-bar" x="0" y="4" width="28" height="20" rx="6"/><rect class="pd-mark-range" x="8" y="9" width="12" height="10" rx="3"/></svg>';
}

function pd_icon(string $name): string {
  $paths = [
    'arrow' => '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'search' => '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    'bag' => '<path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
    'menu' => '<path d="M4 7h16M4 12h16M4 17h16"/>',
    'crown' => '<path d="m3 8 4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8Z"/>',
    'clock' => '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    'pin' => '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    'external' => '<path d="M14 5h5v5M19 5l-8 8M18 14v5H5V6h5"/>',
  ];
  return '<svg class="pd-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' . ($paths[$name] ?? '') . '</svg>';
}

function pd_vip_chip(): string {
  return '<span class="pd-vip">' . pd_icon('crown') . 'VIP</span>';
}

function pd_avatar(WC_Product $product, string $class = 'pd-avatar'): string {
  $url = $product->get_meta('_pd_foto');
  if (!$url) return '';
  return '<img class="' . esc_attr($class) . '" src="' . esc_url($url) . '" alt="" width="40" height="40" loading="lazy" decoding="async">';
}

function pd_profile_url(WC_Product $product): string {
  $slug = (string) $product->get_meta('_pd_prestador_slug');
  if (function_exists('pd_is_store_provider') && pd_is_store_provider($slug)) { $link = get_term_link($slug, 'product_brand'); if (!is_wp_error($link)) return $link; }
  return PROPOSTADEV_SITE . '/prestadores/' . rawurlencode($slug);
}

function pd_prazo(WC_Product $product): string {
  $type = $product->get_meta('_pd_tipo_prazo');
  $min = (int) $product->get_meta('_pd_prazo_minimo');
  $max = (int) $product->get_meta('_pd_prazo_maximo');
  $dias = fn ($n) => $n . ($n === 1 ? ' dia' : ' dias');
  return match ($type) {
    'FIXO' => $dias($min),
    'A_PARTIR_DE' => 'a partir de ' . $dias($min),
    'INTERVALO' => "$min a " . $dias($max),
    default => 'prazo a combinar',
  };
}

/* ---------------------------------------------------------------- Regras da Oferta */

// Preço conforme o tipo de preço da Oferta no site, sempre com unidade.
add_filter('woocommerce_get_price_html', function ($html, $product) {
  $type = $product->get_meta('_pd_tipo_preco');
  $min = $product->get_meta('_pd_preco_minimo');
  $max = $product->get_meta('_pd_preco_maximo');
  if (!$type) return $html;
  return match ($type) {
    'A_PARTIR_DE' => '<span class="pd-price-pre">a partir de</span> ' . wc_price($min),
    'INTERVALO' => wc_price($min) . ' <span class="pd-price-pre">a</span> ' . wc_price($max),
    'POR_HORA' => wc_price($min) . '<span class="pd-price-unit">/hora</span>',
    'SOB_CONSULTA' => '<span class="pd-price-pre">Sob consulta</span>',
    default => wc_price($min) . ' <span class="pd-price-unit">por projeto</span>',
  };
}, 10, 2);

// Oferta sob consulta não vai para o carrinho: o Cliente pede orçamento no site.
add_filter('woocommerce_is_purchasable', fn ($ok, $product) => $product->get_meta('_pd_tipo_preco') === 'SOB_CONSULTA' ? false : $ok, 10, 2);
add_filter('woocommerce_product_single_add_to_cart_text', fn () => 'Contratar');
add_filter('woocommerce_product_add_to_cart_text', function ($text, $product) {
  if ($product->get_meta('_pd_tipo_preco') === 'SOB_CONSULTA') return 'Ver detalhes';
  return $product->is_purchasable() ? 'Contratar' : $text;
}, 10, 2);
add_filter('woocommerce_product_add_to_cart_description', fn ($d, $p) => 'Contratar ' . $p->get_name(), 10, 2);

/* ---------------------------------------------------------------- Cabeçalho */

add_action('init', function () {
  remove_all_actions('storefront_header');
  remove_all_actions('storefront_footer');
  remove_action('storefront_before_content', 'storefront_header_widget_region', 10);
  add_action('storefront_header', 'pd_header', 10);
  add_action('storefront_footer', 'pd_footer', 10);
});

function pd_cart_link(): string {
  $count = function_exists('WC') && WC()->cart ? WC()->cart->get_cart_contents_count() : 0;
  $label = $count ? sprintf('Carrinho com %d %s', $count, $count === 1 ? 'serviço' : 'serviços') : 'Carrinho vazio';
  return '<a class="pd-cart' . ($count ? ' has-items' : '') . '" href="' . esc_url(wc_get_cart_url()) . '" aria-label="' . esc_attr($label) . '">' . pd_icon('bag') . '<span>Carrinho</span>' . ($count ? '<span class="pd-cart-count">' . $count . '</span>' : '') . '</a>';
}
add_filter('woocommerce_add_to_cart_fragments', function ($fragments) { $fragments['a.pd-cart'] = pd_cart_link(); return $fragments; });

function pd_nav(string $class): string {
  return (string) wp_nav_menu(['theme_location' => 'primary', 'container' => false, 'menu_class' => $class, 'depth' => 1, 'echo' => false, 'fallback_cb' => '__return_empty_string']);
}

function pd_search(string $id): string {
  return '<form role="search" method="get" class="pd-search" action="' . esc_url(home_url('/')) . '"><label class="screen-reader-text" for="' . esc_attr($id) . '">Buscar serviços</label>' . pd_icon('search') . '<input id="' . esc_attr($id) . '" type="search" name="s" placeholder="Buscar serviços" value="' . esc_attr(get_search_query()) . '"><input type="hidden" name="post_type" value="product"></form>';
}

function pd_account_links(): array {
  if (!is_user_logged_in()) return [];
  $user = wp_get_current_user();
  $links = [];
  if (in_array('prestador', (array) $user->roles, true) && function_exists('pd_provider_orders')) {
    $waiting = count(pd_provider_orders(pd_user_provider_slug($user), ['wc-aguardando']));
    $links[] = [wc_get_account_endpoint_url('contratacoes-recebidas'), 'Contratações recebidas', $waiting];
  } elseif (!current_user_can('manage_woocommerce')) {
    $links[] = [wc_get_account_endpoint_url('orders'), 'Minhas Contratações', 0];
  }
  if (current_user_can('manage_woocommerce')) $links[] = [admin_url('admin.php?page=wc-orders'), 'Painel da Equipe', 0];
  $links[] = [wc_get_account_endpoint_url('edit-account'), 'Dados da conta', 0];
  $links[] = [wc_logout_url(home_url('/')), 'Sair', 0];
  return $links;
}

// Entrar a partir de qualquer página leva de volta a ela depois do login.
function pd_login_url(): string {
  $account = wc_get_page_permalink('myaccount');
  if (is_account_page()) return $account;
  $here = home_url(add_query_arg([], $GLOBALS['wp']->request ?? ''));
  return add_query_arg('redirect', rawurlencode(trailingslashit($here)), $account);
}

function pd_account_entry(): string {
  if (!is_user_logged_in()) {
    return '<a class="pd-login" href="' . esc_url(pd_login_url()) . '">Entrar</a>';
  }
  $user = wp_get_current_user();
  $first = $user->first_name ?: $user->display_name;
  $badge = array_sum(array_column(pd_account_links(), 2));
  $out = '<details class="pd-account"><summary><span class="pd-account-avatar" aria-hidden="true">' . esc_html(mb_strtoupper(mb_substr($first, 0, 1))) . '</span><span class="pd-account-name">' . esc_html($first) . '</span>' . ($badge ? '<span class="pd-cart-count" title="' . esc_attr($badge . ($badge === 1 ? ' Contratação aguardando você' : ' Contratações aguardando você')) . '"><span aria-hidden="true">' . $badge . '</span><span class="screen-reader-text">' . esc_html($badge . ($badge === 1 ? ' Contratação aguardando você' : ' Contratações aguardando você')) . '</span></span>' : '') . '</summary><div class="pd-account-panel"><p class="pd-account-who">' . esc_html($user->display_name) . '<span>' . esc_html(in_array('prestador', (array) $user->roles, true) ? 'Prestador' : (current_user_can('manage_woocommerce') ? 'Equipe da plataforma' : 'Cliente')) . '</span></p><ul>';
  foreach (pd_account_links() as [$url, $label, $count]) $out .= '<li><a href="' . esc_url($url) . '">' . esc_html($label) . ($count ? ' <span class="pd-cart-count">' . (int) $count . '</span>' : '') . '</a></li>';
  return $out . '</ul></div></details>';
}

function pd_header(): void {
  echo '<div class="col-full pd-header">';
  echo '<a class="pd-wordmark" href="' . esc_url(home_url('/')) . '" aria-label="Proposta.dev, início da loja">' . pd_mark() . '<span>Proposta<span class="pd-wordmark-dev">.dev</span></span></a>';
  echo '<nav class="pd-nav" aria-label="Principal">' . pd_nav('pd-nav-list') . '</nav>';
  echo '<div class="pd-header-tools">' . pd_search('pd-busca') . pd_account_entry() . pd_cart_link() . '</div>';
  echo '<details class="pd-mobile-menu"><summary>' . pd_icon('menu') . '<span>Menu</span></summary><div class="pd-mobile-panel">' . pd_search('pd-busca-mobile') . '<nav aria-label="Principal no celular">' . pd_nav('pd-mobile-list') . '</nav>' . pd_mobile_account() . '</div></details>';
  echo '</div>';
}

function pd_mobile_account(): string {
  if (!is_user_logged_in()) return '<div class="pd-mobile-account"><a class="pd-btn pd-btn-primary pd-btn-block" href="' . esc_url(pd_login_url()) . '">Entrar ou criar conta</a></div>';
  $out = '<div class="pd-mobile-account"><p class="pd-account-who">' . esc_html(wp_get_current_user()->display_name) . '</p><ul class="pd-mobile-list">';
  foreach (pd_account_links() as [$url, $label, $count]) $out .= '<li><a href="' . esc_url($url) . '">' . esc_html($label) . ($count ? ' <span class="pd-cart-count">' . (int) $count . '</span>' : '') . '</a></li>';
  return $out . '</ul></div>';
}

// Fecha os menus do cabeçalho com Esc ou clique fora (são <details>, funcionam sem JavaScript).
add_action('wp_footer', function () {
  echo "<script>document.addEventListener('click',e=>{document.querySelectorAll('.pd-header details[open]').forEach(d=>{if(!d.contains(e.target))d.removeAttribute('open')})});document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.pd-header details[open]').forEach(d=>{d.removeAttribute('open');d.querySelector('summary').focus()})});</script>";
});

/* ---------------------------------------------------------------- Página inicial */

add_action('wp', function () {
  remove_all_actions('homepage');
  add_action('homepage', 'pd_home_hero', 10);
  add_action('homepage', 'pd_home_vip', 20);
  add_action('homepage', 'pd_home_how', 30);
  add_action('homepage', 'pd_home_rated', 40);
  add_action('homepage', 'pd_home_triage', 50);
  // Páginas da loja em largura total, sem barra lateral de blog nem navegação lateral entre produtos.
  remove_action('storefront_sidebar', 'storefront_get_sidebar', 10);
  remove_action('woocommerce_after_single_product_summary', 'storefront_single_product_pagination', 30);
  remove_action('storefront_after_footer', 'storefront_sticky_single_add_to_cart', 999);
});
add_filter('body_class', fn ($c) => array_merge($c, ['storefront-full-width-content']));
// A capa é uma arte única por Oferta: sem carrossel, zoom nem lightbox (o carrossel media a imagem antes do layout e a cortava).
add_action('after_setup_theme', function () {
  remove_theme_support('wc-product-gallery-zoom');
  remove_theme_support('wc-product-gallery-slider');
  remove_theme_support('wc-product-gallery-lightbox');
}, 99);

function pd_top_categories(): array {
  $default = (int) get_option('default_product_cat');
  return array_values(array_filter(get_terms(['taxonomy' => 'product_cat', 'parent' => 0, 'hide_empty' => true]), fn ($t) => $t->term_id !== $default));
}

function pd_home_hero(): void {
  $shop = wc_get_page_permalink('shop');
  echo '<section class="pd-hero">';
  echo '<div class="pd-hero-copy"><h1>Contrate desenvolvimento com preço e prazo claros.</h1>';
  echo '<p>Ofertas anunciadas por quem desenvolve, com preço, prazo e Avaliações. Você contrata sem pagar nada agora: o Prestador confirma o escopo e combina o pagamento.</p>';
  echo '<div class="pd-actions"><a class="pd-btn pd-btn-primary" href="' . esc_url($shop) . '">Ver todos os serviços</a><a class="pd-btn pd-btn-ghost" href="' . esc_url(PROPOSTADEV_SITE . '/triagem') . '">Não sei o que preciso</a></div></div>';
  echo '<aside class="pd-need" aria-labelledby="pd-need-title"><h2 id="pd-need-title">O que você precisa?</h2><ul>';
  foreach (pd_top_categories() as $cat) {
    foreach (get_terms(['taxonomy' => 'product_cat', 'parent' => $cat->term_id, 'hide_empty' => true]) as $type) {
      echo '<li><a href="' . esc_url(get_term_link($type)) . '"><span>' . esc_html($type->name) . '</span><span class="pd-need-count">' . (int) $type->count . '</span>' . pd_icon('arrow') . '</a></li>';
    }
  }
  echo '</ul></aside></section>';
}

function pd_section_head(string $title, string $lead, string $link = '', string $linkText = ''): void {
  echo '<header class="pd-section-head"><div><h2>' . esc_html($title) . '</h2><p>' . esc_html($lead) . '</p></div>';
  if ($link) echo '<a class="pd-link" href="' . esc_url($link) . '">' . esc_html($linkText) . pd_icon('arrow') . '</a>';
  echo '</header>';
}

function pd_home_vip(): void {
  echo '<section class="pd-section">';
  pd_section_head('Destaque VIP', 'Ofertas de Prestadores VIP. O destaque não muda a ordem do catálogo.', wc_get_page_permalink('shop'), 'Todos os serviços');
  echo do_shortcode('[products limit="4" columns="4" visibility="featured" orderby="rand"]');
  echo '</section>';
}

function pd_home_how(): void {
  $steps = [
    ['Escolha a Oferta', 'Compare preço, prazo e Avaliações de quem já contratou.'],
    ['Contrate sem pagar agora', 'Conte o seu Projeto na Contratação. Nenhum valor é cobrado.'],
    ['Combine com o Prestador', 'Ele confirma o escopo, o valor final e a forma de pagamento.'],
  ];
  echo '<section class="pd-how" aria-labelledby="pd-how-title"><h2 id="pd-how-title">Como funciona a contratação</h2><ol>';
  foreach ($steps as [$t, $d]) echo '<li><h3>' . esc_html($t) . '</h3><p>' . esc_html($d) . '</p></li>';
  echo '</ol></section>';
}

function pd_home_rated(): void {
  echo '<section class="pd-section">';
  pd_section_head('Mais bem avaliados', 'Ofertas de Prestadores com as melhores notas dos Clientes.');
  echo do_shortcode('[products limit="4" columns="4" orderby="rating"]');
  echo '</section>';
}

function pd_home_triage(): void {
  echo '<section class="pd-triage"><div><h2>Precisa de algo sob medida?</h2><p>Na plataforma Proposta.dev, a Triagem descobre o tipo de serviço, mostra quanto costuma custar e você recebe Propostas de quem desenvolve.</p></div>';
  echo '<a class="pd-btn pd-btn-dark" href="' . esc_url(PROPOSTADEV_SITE . '/triagem') . '">Começar a Triagem' . pd_icon('arrow') . '</a></section>';
}

/* ---------------------------------------------------------------- Cards do catálogo */

add_action('init', function () {
  remove_action('woocommerce_before_shop_loop_item_title', 'woocommerce_show_product_loop_sale_flash', 10);
  remove_action('woocommerce_after_shop_loop_item_title', 'woocommerce_template_loop_rating', 5);
  add_action('woocommerce_after_shop_loop_item_title', 'pd_loop_meta', 4);
  remove_action('woocommerce_single_product_summary', 'woocommerce_template_single_excerpt', 20);
  remove_action('woocommerce_single_product_summary', 'woocommerce_template_single_meta', 40);
  remove_action('woocommerce_single_product_summary', 'woocommerce_template_single_rating', 10);
  add_action('woocommerce_single_product_summary', 'pd_single_provider', 6);
  add_action('woocommerce_single_product_summary', 'pd_single_terms', 25);
  add_action('woocommerce_single_product_summary', 'pd_single_after_cta', 35);
});

function pd_rating_line(WC_Product $product): string {
  $count = $product->get_review_count();
  if (!$count) return '<span class="pd-rating pd-rating-none">Sem Avaliações ainda</span>';
  $avg = number_format((float) $product->get_average_rating(), 1, ',', '');
  return '<span class="pd-rating">' . wc_get_rating_html((float) $product->get_average_rating(), $count) . '<span>' . $avg . ' · ' . sprintf(_n('%d Avaliação', '%d Avaliações', $count), $count) . '</span></span>';
}

function pd_loop_meta(): void {
  global $product;
  $name = $product->get_meta('_pd_prestador');
  if (!$name) return;
  echo '<span class="pd-provider">' . pd_avatar($product, 'pd-avatar pd-avatar-sm') . '<span>' . esc_html($name) . '</span>' . ($product->get_meta('_pd_vip') === 'sim' ? pd_vip_chip() : '') . '</span>';
  echo pd_rating_line($product);
  echo '<span class="pd-deadline">' . pd_icon('clock') . esc_html(pd_prazo($product)) . '</span>';
}

/* ---------------------------------------------------------------- Página do serviço */

function pd_single_provider(): void {
  global $product;
  $name = $product->get_meta('_pd_prestador');
  if (!$name) return;
  $local = $product->get_meta('_pd_local');
  $years = (int) $product->get_meta('_pd_anos');
  $facts = array_filter([$local, $years ? $years . ' anos de experiência' : '']);
  echo '<a class="pd-provider-card" href="' . esc_url(pd_profile_url($product)) . '" target="_blank" rel="noopener">' . pd_avatar($product, 'pd-avatar pd-avatar-lg');
  echo '<span class="pd-provider-text"><span class="pd-provider-name">' . esc_html($name) . ($product->get_meta('_pd_vip') === 'sim' ? ' ' . pd_vip_chip() : '') . '</span>';
  echo '<span class="pd-provider-facts">' . esc_html(implode(' · ', $facts)) . '</span>' . pd_rating_line($product) . '</span>';
  echo '<span class="pd-provider-go">Perfil ' . pd_icon('external') . '</span></a>';
}

function pd_single_terms(): void {
  global $product;
  if (!$product->get_meta('_pd_prestador')) return;
  $type = $product->get_meta('_pd_tipo_preco');
  $note = match ($type) {
    'INTERVALO', 'A_PARTIR_DE' => 'O pedido reserva o valor inicial. O Prestador confirma o valor final depois de entender o seu Projeto.',
    'POR_HORA' => 'Escolha quantas horas quer contratar. O Prestador confirma a estimativa com você.',
    'SOB_CONSULTA' => 'Este Prestador define o preço depois de conhecer o Projeto.',
    default => 'Preço fechado para o escopo descrito. O Prestador confirma o escopo antes de começar.',
  };
  echo '<dl class="pd-terms"><div><dt>' . pd_icon('clock') . 'Prazo estimado</dt><dd>' . esc_html(ucfirst(pd_prazo($product))) . '</dd></div></dl>';
  echo '<p class="pd-note">' . esc_html($note) . '</p>';
  if ($type === 'SOB_CONSULTA') echo '<a class="pd-btn pd-btn-primary pd-btn-block" href="' . esc_url(pd_profile_url($product)) . '" target="_blank" rel="noopener">Pedir orçamento no Proposta.dev' . pd_icon('external') . '</a>';
}

function pd_single_after_cta(): void {
  global $product;
  if (!$product->get_meta('_pd_prestador') || !$product->is_purchasable()) return;
  echo '<p class="pd-reassure">Nenhum valor é cobrado na Contratação. Você combina o pagamento direto com o Prestador.</p>';
}

add_filter('woocommerce_product_tabs', function ($tabs) {
  global $product;
  if (isset($tabs['description'])) $tabs['description']['title'] = 'O que está incluído';
  if (isset($tabs['reviews'])) $tabs['reviews']['title'] = sprintf('Avaliações (%d)', $product ? $product->get_review_count() : 0);
  unset($tabs['additional_information']);
  if ($product && $product->get_meta('_pd_prestador')) {
    $tabs['prestador'] = ['title' => 'Sobre o Prestador', 'priority' => 15, 'callback' => function () use ($product) {
      $brands = wp_get_post_terms($product->get_id(), 'product_brand');
      echo '<h2>' . esc_html($product->get_meta('_pd_prestador')) . '</h2>';
      if ($brands && $brands[0]->description) echo wpautop(esc_html($brands[0]->description));
      echo '<p class="pd-actions"><a class="pd-btn pd-btn-ghost" href="' . esc_url(pd_profile_url($product)) . '" target="_blank" rel="noopener">Ver Perfil completo no Proposta.dev' . pd_icon('external') . '</a>';
      if ($brands) echo '<a class="pd-link" href="' . esc_url(get_term_link($brands[0])) . '">Todas as Ofertas deste Prestador' . pd_icon('arrow') . '</a>';
      echo '</p>';
    }];
  }
  return $tabs;
}, 20);
add_filter('woocommerce_product_description_heading', '__return_empty_string');
add_filter('woocommerce_product_related_products_heading', fn () => 'Outros serviços parecidos');
add_filter('woocommerce_output_related_products_args', fn ($a) => array_merge($a, ['posts_per_page' => 4, 'columns' => 4]));
add_filter('woocommerce_reviews_title', fn ($t, $count) => $count ? 'Avaliações do Prestador' : $t, 10, 2);
add_filter('woocommerce_product_review_comment_form_args', function ($args) {
  $args['title_reply'] = 'Avaliar este Prestador';
  $args['label_submit'] = 'Publicar Avaliação';
  return $args;
});

/* ---------------------------------------------------------------- Catálogo, categorias e Prestador */

add_filter('woocommerce_show_page_title', '__return_false');
add_action('woocommerce_before_main_content', function () {
  if (!is_shop() && !is_product_taxonomy() && !is_search()) return;
  $term = is_product_taxonomy() ? get_queried_object() : null;
  echo '<header class="pd-archive-head">';
  if ($term && $term->taxonomy === 'product_brand') {
    $foto = get_term_meta($term->term_id, 'pd_foto', true);
    $slug = get_term_meta($term->term_id, 'pd_slug', true);
    echo '<div class="pd-brand-head">' . ($foto ? '<img class="pd-avatar pd-avatar-xl" src="' . esc_url($foto) . '" alt="" width="96" height="96">' : '<span class="pd-avatar pd-avatar-xl pd-avatar-initial" aria-hidden="true">' . esc_html(mb_strtoupper(mb_substr($term->name, 0, 1))) . '</span>') . '<div><h1>' . esc_html($term->name) . '</h1>';
    if ($term->description) echo '<p>' . esc_html($term->description) . '</p>';
    if (get_term_meta($term->term_id, 'pd_loja', true) === '1') { $facts = array_filter([get_term_meta($term->term_id, 'pd_local', true), ($y = (int) get_term_meta($term->term_id, 'pd_anos', true)) ? $y . ' anos de experiência' : '', 'Prestador da loja']); echo '<p class="pd-note">' . esc_html(implode(' · ', $facts)) . '</p>'; }
    elseif ($slug) echo '<a class="pd-link" href="' . esc_url(PROPOSTADEV_SITE . '/prestadores/' . rawurlencode($slug)) . '" target="_blank" rel="noopener">Ver Perfil completo no Proposta.dev' . pd_icon('external') . '</a>';
    echo '</div></div>';
  } else {
    $title = is_search() ? sprintf('Resultados para “%s”', get_search_query()) : ($term ? $term->name : 'Todos os serviços');
    echo '<h1>' . esc_html($title) . '</h1>';
    echo '<p>' . esc_html($term && $term->description ? $term->description : 'Ofertas com preço, prazo e Avaliações. Contrate sem pagar nada agora.') . '</p>';
    pd_type_chips($term);
  }
  echo '</header>';
}, 25);

function pd_type_chips($current): void {
  $currentId = $current ? $current->term_id : 0;
  echo '<nav class="pd-chips" aria-label="Tipo de serviço"><a class="pd-chip' . (!$currentId ? ' is-current' : '') . '" href="' . esc_url(wc_get_page_permalink('shop')) . '"' . (!$currentId ? ' aria-current="page"' : '') . '>Todos</a>';
  foreach (pd_top_categories() as $cat) {
    foreach (get_terms(['taxonomy' => 'product_cat', 'parent' => $cat->term_id, 'hide_empty' => true]) as $type) {
      $on = in_array($currentId, [$type->term_id], true);
      echo '<a class="pd-chip' . ($on ? ' is-current' : '') . '" href="' . esc_url(get_term_link($type)) . '"' . ($on ? ' aria-current="page"' : '') . '>' . esc_html($type->name) . '</a>';
    }
  }
  echo '</nav>';
}

add_action('init', function () {
  remove_action('woocommerce_after_shop_loop', 'woocommerce_catalog_ordering', 10);
  remove_action('woocommerce_after_shop_loop', 'woocommerce_result_count', 20);
  remove_action('woocommerce_before_shop_loop', 'storefront_sorting_wrapper', 9);
  remove_action('woocommerce_before_shop_loop', 'storefront_sorting_wrapper_close', 31);
  remove_action('woocommerce_after_shop_loop', 'storefront_sorting_wrapper', 9);
  remove_action('woocommerce_after_shop_loop', 'storefront_sorting_wrapper_close', 31);
  remove_action('woocommerce_before_shop_loop', 'woocommerce_pagination', 30);
  remove_action('woocommerce_before_shop_loop', 'storefront_woocommerce_pagination', 30);
});
add_filter('woocommerce_catalog_orderby', fn ($o) => [
  'menu_order' => 'Relevância', 'rating' => 'Melhor avaliação', 'price' => 'Menor preço', 'price-desc' => 'Maior preço', 'date' => 'Mais recentes',
]);
add_filter('loop_shop_columns', fn () => 3);
add_filter('loop_shop_per_page', fn () => 12);

/* ---------------------------------------------------------------- Contratação */

// Carrinho e Contratação (blocos) montam o preço pela Store API, sem o filtro de preço: a unidade vai como dado do item.
add_filter('woocommerce_get_item_data', function ($data, $item) {
  $type = $item['data']->get_meta('_pd_tipo_preco');
  if (!$type) return $data;
  $unit = match ($type) {
    'POR_HORA' => 'por hora',
    'A_PARTIR_DE', 'INTERVALO' => 'valor inicial do projeto; o Prestador confirma o final',
    default => 'por projeto',
  };
  $data[] = ['key' => 'Preço', 'value' => $unit];
  $data[] = ['key' => 'Prazo', 'value' => pd_prazo($item['data'])];
  return $data;
}, 10, 2);

add_filter('woocommerce_checkout_fields', function ($fields) {
  if (isset($fields['order']['order_comments'])) {
    $fields['order']['order_comments']['label'] = 'Descreva seu Projeto';
    $fields['order']['order_comments']['placeholder'] = 'O que você precisa, para quando e qualquer referência útil para o Prestador.';
  }
  return $fields;
});
add_filter('woocommerce_thankyou_order_received_text', fn () => 'O Prestador vai confirmar o escopo e combinar o pagamento com você. Nenhum valor foi cobrado.');
add_filter('gettext', function ($translated, $text, $domain) {
  if ($domain !== 'woocommerce' || (is_admin() && !wp_doing_ajax())) return $translated; // o painel mostra os textos padrão do WooCommerce
  return match ($text) {
    'Your cart is currently empty!', 'Your cart is currently empty.' => 'Seu carrinho está vazio. Escolha uma Oferta para contratar.',
    'Return to shop' => 'Ver serviços',
    'No products were found matching your selection.' => 'Nenhuma Oferta encontrada. Tente outro termo ou escolha um Tipo de serviço acima.',
    'Order received' => 'Contratação recebida',
    default => $translated,
  };
}, 10, 3);

// Carrinho vazio no tom do domínio (o bloco padrão traz título em inglês e uma vitrine com Ofertas que não vão ao carrinho).
add_filter('render_block_woocommerce/empty-cart-block', fn () => '<div class="pd-empty pd-empty-cart"><h2>Seu carrinho está vazio</h2><p>Escolha uma Oferta com preço e prazo claros e contrate sem pagar nada agora.</p><p class="pd-actions"><a class="pd-btn pd-btn-primary" href="' . esc_url(wc_get_page_permalink('shop')) . '">Ver todos os serviços</a><a class="pd-btn pd-btn-ghost" href="' . esc_url(PROPOSTADEV_SITE . '/triagem') . '">Não sei o que preciso</a></p></div>');

// 404: busca, caminho de volta e as Ofertas mais procuradas, sem os widgets padrão do tema.
add_action('storefront_before_content', function () {
  if (!is_404()) return;
  echo '<div class="col-full pd-404"><h1>Esta página não existe</h1><p>O endereço pode ter mudado. Busque um serviço ou volte ao catálogo.</p>' . pd_search('pd-busca-404') . '<p class="pd-actions"><a class="pd-btn pd-btn-primary" href="' . esc_url(wc_get_page_permalink('shop')) . '">Ver todos os serviços</a><a class="pd-btn pd-btn-ghost" href="' . esc_url(home_url('/')) . '">Ir para o início</a></p></div>';
}, 20);

/* ---------------------------------------------------------------- Rodapé */

function pd_footer(): void {
  $shop = wc_get_page_permalink('shop');
  echo '<div class="pd-footer">';
  echo '<div class="pd-footer-grid"><div class="pd-footer-brand"><a class="pd-wordmark pd-wordmark-light" href="' . esc_url(home_url('/')) . '">' . pd_mark() . '<span>Proposta<span class="pd-wordmark-dev">.dev</span></span></a><p>Loja da plataforma Proposta.dev: Ofertas de desenvolvimento com preço e prazo claros.</p></div>';
  echo '<nav aria-label="Loja"><h2>Loja</h2><ul><li><a href="' . esc_url($shop) . '">Todos os serviços</a></li>';
  foreach (pd_top_categories() as $cat) echo '<li><a href="' . esc_url(get_term_link($cat)) . '">' . esc_html($cat->name) . '</a></li>';
  echo '<li><a href="' . esc_url(wc_get_cart_url()) . '">Carrinho</a></li><li><a href="' . esc_url(wc_get_page_permalink('myaccount')) . '">Minha conta</a></li></ul></nav>';
  echo '<nav aria-label="Plataforma"><h2>Plataforma</h2><ul>';
  echo '<li><a href="' . esc_url(home_url('/quero-oferecer-servicos/')) . '">Oferecer serviços na loja</a></li>';
  foreach (['/triagem' => 'Começar a Triagem', '/buscar' => 'Buscar desenvolvedores', '/' => 'Ir para o Proposta.dev'] as $path => $label) echo '<li><a href="' . esc_url(PROPOSTADEV_SITE . $path) . '">' . esc_html($label) . '</a></li>';
  echo '</ul></nav></div>';
  echo '<p class="pd-footer-legal">© ' . esc_html(date('Y')) . ' Proposta.dev. Nenhum pagamento é processado nesta loja: o valor é combinado diretamente entre Cliente e Prestador.<br><span class="pd-demo">Projeto acadêmico em demonstração: Prestadores, Ofertas e Avaliações exibidos são fictícios. Loja feita com WooCommerce (WordPress).</span></p>';
  echo '<p class="pd-footer-giant" aria-hidden="true">Proposta.dev</p>';
  echo '</div>';
}

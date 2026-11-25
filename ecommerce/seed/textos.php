<?php
// Textos dos blocos de Carrinho e Contratação (os blocos não passam pelo gettext do PHP; o rótulo é atributo do bloco). Idempotente.
$labels = [
  (int) get_option('woocommerce_cart_page_id') => ['<!-- wp:woocommerce/proceed-to-checkout-block -->', '<!-- wp:woocommerce/proceed-to-checkout-block {"buttonLabel":"Ir para a Contratação"} -->'],
  (int) get_option('woocommerce_checkout_page_id') => ['<!-- wp:woocommerce/checkout-actions-block -->', '<!-- wp:woocommerce/checkout-actions-block {"placeOrderButtonLabel":"Confirmar Contratação"} -->'],
];
foreach ($labels as $id => [$from, $to]) {
  $content = get_post_field('post_content', $id);
  if (str_contains($content, $from)) wp_update_post(['ID' => $id, 'post_content' => str_replace($from, $to, $content)]);
}
WP_CLI::success('Textos do Carrinho e da Contratação aplicados.');

<?php
// A página de Contratação usa o checkout clássico (shortcode): os campos são do domínio (Projeto obrigatório, sem endereço) e os textos passam pelo PHP. Idempotente.
$id = (int) get_option('woocommerce_checkout_page_id');
$content = '<!-- wp:shortcode -->[woocommerce_checkout]<!-- /wp:shortcode -->';
if (get_post_field('post_content', $id) !== $content) wp_update_post(['ID' => $id, 'post_content' => $content]);
WP_CLI::success('Contratação no checkout clássico.');

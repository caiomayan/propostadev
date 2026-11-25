<?php
// Importa o catálogo da demo (catalogo.json, exportado por scripts/exportar-catalogo-loja.ts) para o WooCommerce. Idempotente.
// Mapeamento (ADR 0006): Oferta -> produto; Categoria > Tipo de serviço -> categorias do produto; Prestador -> marca (product_brand);
// Avaliação do Prestador -> avaliação em cada produto dele; Prestador VIP -> produto em destaque.
// Rodar: wp eval-file /seed/importar.php

require_once ABSPATH . 'wp-admin/includes/media.php';
require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/image.php';

$data = json_decode(file_get_contents('/seed/catalogo.json'), true);

function pd_term(string $name, string $slug, string $taxonomy, int $parent = 0, string $description = ''): int {
  $existing = get_term_by('slug', $slug, $taxonomy);
  if ($existing) {
    if ($description) wp_update_term($existing->term_id, $taxonomy, ['description' => $description]);
    return (int) $existing->term_id;
  }
  $created = wp_insert_term($name, $taxonomy, ['slug' => $slug, 'parent' => $parent, 'description' => $description]);
  if (is_wp_error($created)) throw new Exception($created->get_error_message());
  return (int) $created['term_id'];
}

function pd_cover(string $slug): int {
  $found = get_posts(['post_type' => 'attachment', 'meta_key' => '_pd_capa', 'meta_value' => $slug, 'numberposts' => 1, 'fields' => 'ids']);
  if ($found) return (int) $found[0];
  $tmp = wp_tempnam($slug . '.png');
  copy("/seed/capas/$slug.png", $tmp);
  $id = media_handle_sideload(['name' => "capa-$slug.png", 'tmp_name' => $tmp], 0);
  if (is_wp_error($id)) throw new Exception($id->get_error_message());
  update_post_meta($id, '_pd_capa', $slug);
  return (int) $id;
}

$reviewsByProvider = [];
foreach ($data['avaliacoes'] as $r) $reviewsByProvider[$r['prestador_slug']][] = $r;

$created = 0;
foreach ($data['ofertas'] as $o) {
  $parent = pd_term($o['categoria'], $o['categoria_slug'], 'product_cat');
  $child = pd_term($o['tipo'], $o['tipo_slug'], 'product_cat', $parent);
  $brand = taxonomy_exists('product_brand') ? pd_term($o['prestador'], $o['prestador_slug'], 'product_brand', 0, $o['prestador_descricao']) : 0;

  $existing = wc_get_products(['meta_key' => '_pd_oferta_id', 'meta_value' => $o['id'], 'limit' => 1, 'status' => 'any']);
  $product = $existing ? $existing[0] : new WC_Product_Simple();
  $product->set_name($o['titulo']);
  $product->set_slug(sanitize_title($o['titulo'] . '-' . $o['prestador']));
  $product->set_description(wpautop(esc_html($o['descricao'])));
  $product->set_short_description(esc_html($o['tipo'] . ' por ' . $o['prestador'] . '.'));
  $product->set_status('publish');
  $product->set_virtual(true);
  $product->set_sold_individually($o['tipo_preco'] !== 'POR_HORA');
  $product->set_regular_price($o['tipo_preco'] === 'SOB_CONSULTA' ? '' : $o['preco_minimo']);
  $product->set_category_ids([$parent, $child]);
  $product->set_featured((bool) $o['vip']);
  $product->set_reviews_allowed(true);
  $product->set_image_id(pd_cover(file_exists("/seed/capas/oferta-{$o['id']}.png") ? "oferta-{$o['id']}" : $o['tipo_slug']));
  $meta = [
    '_pd_oferta_id' => $o['id'], '_pd_tipo_preco' => $o['tipo_preco'], '_pd_preco_minimo' => $o['preco_minimo'], '_pd_preco_maximo' => $o['preco_maximo'],
    '_pd_tipo_prazo' => $o['tipo_prazo'], '_pd_prazo_minimo' => $o['prazo_minimo_dias'], '_pd_prazo_maximo' => $o['prazo_maximo_dias'],
    '_pd_prestador' => $o['prestador'], '_pd_prestador_slug' => $o['prestador_slug'], '_pd_vip' => $o['vip'] ? 'sim' : 'nao',
    '_pd_foto' => $o['foto_url'] ?? '', '_pd_local' => trim(($o['cidade'] ?? '') . ($o['uf'] ? '/' . $o['uf'] : ''), '/'), '_pd_anos' => $o['anos_experiencia'],
  ];
  foreach ($meta as $k => $v) $product->update_meta_data($k, $v ?? '');
  $id = $product->save();
  if ($brand) {
    wp_set_object_terms($id, [$brand], 'product_brand');
    update_term_meta($brand, 'pd_foto', $o['foto_url'] ?? '');
    update_term_meta($brand, 'pd_slug', $o['prestador_slug']);
  }
  if (!$existing) $created++;

  foreach ($reviewsByProvider[$o['prestador_slug']] ?? [] as $r) {
    $key = md5($r['autor'] . $r['data'] . $r['comentario']);
    if (get_comments(['post_id' => $id, 'meta_key' => '_pd_avaliacao', 'meta_value' => $key, 'count' => true])) continue;
    $comment = wp_insert_comment([
      'comment_post_ID' => $id, 'comment_author' => $r['autor'], 'comment_author_email' => '', 'comment_content' => $r['comentario'],
      'comment_type' => 'review', 'comment_approved' => 1, 'comment_date' => $r['data'] . ' 12:00:00',
    ]);
    update_comment_meta($comment, 'rating', (int) $r['nota']);
    update_comment_meta($comment, '_pd_avaliacao', $key);
  }
  WC_Comments::clear_transients($id);
}

// Capa das categorias: a do Tipo de serviço mais representativo (ou a do próprio Tipo).
$covers = ['web' => 'site-institucional', 'backend-e-apis' => 'api', 'manutencao-e-integracoes' => 'manutencao-web'];
foreach ($data['ofertas'] as $o) {
  update_term_meta(get_term_by('slug', $o['tipo_slug'], 'product_cat')->term_id, 'thumbnail_id', pd_cover($o['tipo_slug']));
  $parentCover = $covers[$o['categoria_slug']] ?? $o['tipo_slug'];
  if (file_exists("/seed/capas/$parentCover.png")) update_term_meta(get_term_by('slug', $o['categoria_slug'], 'product_cat')->term_id, 'thumbnail_id', pd_cover($parentCover));
}
// Sem categoria padrão sobrando na vitrine.
$uncategorized = get_term_by('slug', 'uncategorized', 'product_cat') ?: get_term_by('slug', 'sem-categoria', 'product_cat');
if ($uncategorized && !$uncategorized->count) update_term_meta($uncategorized->term_id, 'order', 999);

WP_CLI::success(sprintf('Catálogo: %d Ofertas (%d novas), %d Avaliações de origem.', count($data['ofertas']), $created, count($data['avaliacoes'])));

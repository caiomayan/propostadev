<?php
// Contas e Contratações da demo da loja (ADR 0006). Idempotente; com a variável PD_RESET=1 também volta a demo ao ponto de partida:
// apaga todas as Contratações e as Avaliações feitas na loja e recria as duas Contratações de exemplo.
// Senha das contas: DEMO_PASSWORD (a mesma das contas demo do site). Rodar: wp eval-file /seed/demo.php

$password = getenv('DEMO_PASSWORD') ?: '';
$data = json_decode(file_get_contents('/seed/catalogo.json'), true);

function pd_demo_user(string $email, string $name, string $role, string $password, array $meta = []): int {
  $user = get_user_by('email', $email);
  if (!$user) {
    if (!$password) { WP_CLI::warning("Sem DEMO_PASSWORD: conta $email não criada."); return 0; }
    $id = wp_insert_user(['user_login' => $email, 'user_email' => $email, 'user_pass' => $password, 'display_name' => $name, 'first_name' => strtok($name, ' '), 'last_name' => trim(substr($name, strlen(strtok($name, ' ')))), 'role' => $role]);
    if (is_wp_error($id)) throw new Exception($id->get_error_message());
  } else {
    $id = $user->ID;
    wp_update_user(['ID' => $id, 'display_name' => $name, 'role' => $role]);
    if ($password) wp_set_password($password, $id);
  }
  foreach ($meta as $k => $v) update_user_meta($id, $k, $v);
  return (int) $id;
}

// Prestadores: uma conta por Prestador da demo, ligada à marca dele.
$providers = [];
foreach ($data['ofertas'] as $o) $providers[$o['prestador_email']] = $o;
foreach ($providers as $email => $o) pd_demo_user($email, $o['prestador'], 'prestador', $password, ['pd_prestador_slug' => $o['prestador_slug']]);

// Cliente da demo (o mesmo nome do site).
$clientId = pd_demo_user('cliente1@demo.example', 'Mariana Costa', 'customer', $password, [
  'billing_first_name' => 'Mariana', 'billing_last_name' => 'Costa', 'billing_email' => 'cliente1@demo.example', 'billing_country' => 'BR',
  'billing_state' => 'SP', 'billing_city' => 'São Paulo', 'billing_address_1' => 'Rua Augusta, 1200', 'billing_postcode' => '01304-001',
]);

if (getenv('PD_RESET') === '1') {
  foreach (wc_get_orders(['limit' => -1, 'status' => array_keys(wc_get_order_statuses()), 'return' => 'ids']) as $id) wc_get_order($id)->delete(true);
  $own = get_comments(['type' => 'review', 'meta_query' => [['key' => '_pd_avaliacao', 'compare' => 'NOT EXISTS']], 'fields' => 'ids']);
  foreach ($own as $cid) { $post = get_comment($cid)->comment_post_ID; wp_delete_comment($cid, true); WC_Comments::clear_transients($post); }
  if (function_exists('WC') && WC()->session) WC()->session->destroy_session();
  WP_CLI::log(sprintf('Reset: Contratações apagadas e %d Avaliação(ões) feitas na loja removidas.', count($own)));
}

// Duas Contratações de exemplo da Mariana: uma aguardando o Bruno (para a demo do painel do Prestador) e uma concluída com a Aurora (para a Avaliação verificada).
function pd_demo_order(string $key, int $clientId, string $offerId, string $status, string $note): void {
  if (!$clientId || wc_get_orders(['limit' => 1, 'meta_key' => '_pd_demo', 'meta_value' => $key, 'status' => array_keys(wc_get_order_statuses())])) return;
  $product = wc_get_products(['meta_key' => '_pd_oferta_id', 'meta_value' => $offerId, 'limit' => 1])[0] ?? null;
  if (!$product) return;
  $order = wc_create_order(['customer_id' => $clientId, 'customer_note' => $note, 'created_via' => 'demo']);
  $order->add_product($product, 1);
  foreach (['first_name', 'last_name', 'email', 'country', 'state', 'city', 'address_1', 'postcode'] as $f) $order->{"set_billing_$f"}(get_user_meta($clientId, "billing_$f", true));
  $order->set_payment_method('cod');
  $order->set_payment_method_title('Combinar pagamento com o Prestador');
  $order->update_meta_data('_pd_demo', $key);
  $order->calculate_totals();
  $order->set_status($status);
  $order->save();
  $name = $product->get_meta('_pd_prestador');
  if ($status === 'completed') {
    $order->add_order_note("$name confirmou o escopo. O pagamento é combinado direto com você.", true);
    $order->add_order_note("$name concluiu o trabalho. Você já pode avaliar a Oferta.", true);
  }
}
pd_demo_order('bruno', $clientId, '565a1c42-ca47-4a4b-a610-8560a6874a1d', 'aguardando', 'Página para o lançamento do meu curso de confeitaria, com inscrição e depoimentos. Lançamento em 10 de dezembro.');
pd_demo_order('aurora', $clientId, 'c0a79f7d-4dc5-4bfc-9222-fcf9bea7218c', 'completed', 'Landing page da minha loja de bolos, com cardápio e botão de WhatsApp.');

WP_CLI::success(sprintf('Demo da loja: %d contas de Prestador, Cliente cliente1@demo.example e Contratações de exemplo.', count($providers)));

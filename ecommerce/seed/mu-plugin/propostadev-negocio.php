<?php
/**
 * Plugin Name: Proposta.dev na loja — regras de negócio
 * Description: Ciclo da Contratação com os status do domínio, contas de Cliente e de Prestador, painel do Prestador e Avaliação verificada (ADR 0006).
 */

if (!defined('ABSPATH')) exit;

/* ---------------------------------------------------------------- Status da Contratação
 * Aguardando o Prestador → Escopo confirmado → Concluída; ou Recusada pelo Prestador.
 * Só "Concluída" (completed) conta como paga para o WooCommerce: é ela que libera a Avaliação verificada. */

function pd_statuses(): array {
  return [
    'wc-aguardando' => 'Aguardando o Prestador',
    'wc-confirmada' => 'Escopo confirmado',
    'wc-recusada' => 'Recusada pelo Prestador',
  ];
}

add_action('init', function () {
  foreach (pd_statuses() as $key => $label) {
    register_post_status($key, [
      'label' => $label, 'public' => false, 'exclude_from_search' => false, 'show_in_admin_all_list' => true, 'show_in_admin_status_list' => true,
      /* translators: %s: quantidade */
      'label_count' => _n_noop($label . ' <span class="count">(%s)</span>', $label . ' <span class="count">(%s)</span>'),
    ]);
  }
});

add_filter('wc_order_statuses', function ($statuses) {
  $out = [];
  foreach ($statuses as $key => $label) {
    $out[$key] = $label;
    if ($key === 'wc-pending') $out += pd_statuses();
  }
  $out['wc-completed'] = 'Concluída';
  $out['wc-cancelled'] = 'Cancelada';
  return $out;
});

// Contratação nova (pagamento combinado com o Prestador) entra como "Aguardando o Prestador".
add_filter('woocommerce_cod_process_payment_order_status', fn () => 'aguardando');
// Os status do domínio contam como pedido em andamento nos relatórios da Equipe.
add_filter('woocommerce_analytics_excluded_statuses', fn ($s) => array_diff($s, ['aguardando', 'confirmada']));
add_filter('woocommerce_valid_order_statuses_for_cancel', fn ($s) => array_merge($s, ['aguardando']));

function pd_status_help(string $status): string {
  return match ($status) {
    'aguardando' => 'O Prestador recebeu a sua Contratação e vai confirmar o escopo, o valor final e o pagamento com você.',
    'confirmada' => 'O Prestador confirmou o escopo. O trabalho está em andamento; o pagamento é combinado direto com ele.',
    'completed' => 'O Prestador concluiu o trabalho. Agora você pode avaliar a Oferta: a sua Avaliação aparece como Contratação verificada.',
    'recusada' => 'O Prestador não pôde atender este Projeto. Nenhum valor foi cobrado. Veja outras Ofertas do mesmo Tipo de serviço.',
    'cancelled' => 'Esta Contratação foi cancelada. Nenhum valor foi cobrado.',
    default => '',
  };
}

/* ---------------------------------------------------------------- Um Prestador por Contratação */

function pd_product_provider(WC_Product $product): string {
  $parent = $product->get_parent_id() ? wc_get_product($product->get_parent_id()) : null;
  return (string) ($parent ?: $product)->get_meta('_pd_prestador_slug');
}

function pd_order_provider(WC_Order $order): array {
  foreach ($order->get_items() as $item) {
    $product = $item->get_product();
    if ($product) return ['slug' => pd_product_provider($product), 'name' => (string) $product->get_meta('_pd_prestador')];
  }
  return ['slug' => '', 'name' => ''];
}

add_filter('woocommerce_add_to_cart_validation', function ($ok, $productId) {
  $product = wc_get_product($productId);
  if (!$ok || !$product || !WC()->cart) return $ok;
  $provider = pd_product_provider($product);
  foreach (WC()->cart->get_cart() as $line) {
    if (pd_product_provider($line['data']) !== $provider) {
      wc_add_notice('Uma Contratação é feita com um Prestador por vez. Conclua a que está no carrinho ou remova o item antes de contratar outro Prestador.', 'error');
      return false;
    }
  }
  return $ok;
}, 10, 2);

/* ---------------------------------------------------------------- Contas */

add_action('init', function () {
  if (!get_role('prestador')) add_role('prestador', 'Prestador', ['read' => true]);
  add_rewrite_endpoint('contratacoes-recebidas', EP_ROOT | EP_PAGES);
});
add_filter('woocommerce_get_query_vars', fn ($vars) => $vars + ['contratacoes-recebidas' => 'contratacoes-recebidas']);
add_filter('show_admin_bar', fn ($show) => current_user_can('manage_woocommerce') ? $show : false);
add_filter('woocommerce_prevent_admin_access', fn ($prevent) => current_user_can('manage_woocommerce') ? $prevent : true);

function pd_user_provider_slug(?WP_User $user = null): string {
  $user = $user ?: wp_get_current_user();
  return in_array('prestador', (array) $user->roles, true) ? (string) get_user_meta($user->ID, 'pd_prestador_slug', true) : '';
}

add_filter('woocommerce_account_menu_items', function ($items) {
  unset($items['downloads'], $items['edit-address']);
  if (isset($items['orders'])) $items['orders'] = 'Minhas Contratações';
  if (isset($items['edit-account'])) $items['edit-account'] = 'Dados da conta';
  if (pd_user_provider_slug()) {
    $items = ['dashboard' => 'Painel', 'contratacoes-recebidas' => 'Contratações recebidas'] + $items;
    unset($items['orders']);
  }
  return $items;
}, 20);

add_filter('woocommerce_endpoint_orders_title', fn () => 'Minhas Contratações');
add_filter('woocommerce_endpoint_contratacoes-recebidas_title', fn () => 'Contratações recebidas');
add_filter('woocommerce_my_account_my_orders_columns', function ($cols) {
  $cols['order-number'] = 'Contratação';
  $cols['order-actions'] = '';
  return $cols;
});
add_filter('woocommerce_my_account_my_orders_actions', function ($actions) {
  if (isset($actions['view'])) $actions['view']['name'] = 'Ver';
  unset($actions['pay']);
  return $actions;
});

// Painel da conta: diz o que cada papel encontra aqui.
add_action('woocommerce_account_dashboard', function () {
  $slug = pd_user_provider_slug();
  echo '<div class="pd-account-intro">';
  if ($slug) {
    $count = count(pd_provider_orders($slug, ['wc-aguardando']));
    echo '<h2>Você é Prestador nesta loja</h2><p>As Contratações das suas Ofertas chegam em <strong>Contratações recebidas</strong>. Confirme o escopo, recuse quando não puder atender e marque como concluída ao entregar.</p>';
    echo '<p><a class="pd-btn pd-btn-primary" href="' . esc_url(wc_get_account_endpoint_url('contratacoes-recebidas')) . '">Ver Contratações recebidas' . ($count ? ' (' . $count . ' aguardando)' : '') . '</a></p>';
  } else {
    echo '<h2>Acompanhe suas Contratações</h2><p>Em <strong>Minhas Contratações</strong> você vê o status de cada uma e as respostas do Prestador. Depois de concluída, avalie a Oferta.</p>';
    echo '<p><a class="pd-btn pd-btn-primary" href="' . esc_url(wc_get_account_endpoint_url('orders')) . '">Ver Minhas Contratações</a></p>';
  }
  echo '</div>';
}, 5);

/* ---------------------------------------------------------------- Cliente: status explicado na Contratação */

function pd_status_box($order): void {
  $order = is_numeric($order) ? wc_get_order($order) : $order;
  if (!$order) return;
  $help = pd_status_help($order->get_status());
  $provider = pd_order_provider($order);
  if (!$help) return;
  echo '<div class="pd-status pd-status-' . esc_attr($order->get_status()) . '"><span class="pd-status-label">' . esc_html(wc_get_order_status_name($order->get_status())) . '</span>';
  if ($provider['name']) echo '<span class="pd-status-provider">com ' . esc_html($provider['name']) . '</span>';
  echo '<p>' . esc_html($help) . '</p></div>';
}
add_action('woocommerce_view_order', 'pd_status_box', 5);
add_action('woocommerce_thankyou', 'pd_status_box', 5);
add_action('init', fn () => remove_action('woocommerce_order_details_after_order_table', 'woocommerce_order_again_button'));
add_filter('woocommerce_endpoint_view-order_title', fn ($t, $e, $id) => sprintf('Contratação nº %s', $id ?: get_query_var('view-order')), 10, 3);

/* ---------------------------------------------------------------- Prestador: Contratações recebidas */

function pd_provider_orders(string $slug, array $statuses = []): array {
  if (!$slug) return [];
  $orders = wc_get_orders(['limit' => 100, 'orderby' => 'date', 'order' => 'DESC', 'status' => $statuses ?: array_keys(wc_get_order_statuses())]);
  return array_values(array_filter($orders, fn ($o) => pd_order_provider($o)['slug'] === $slug));
}

function pd_transitions(): array {
  return [
    'confirmar' => ['from' => 'aguardando', 'to' => 'confirmada', 'label' => 'Confirmar escopo', 'note' => '%s confirmou o escopo. O pagamento é combinado direto com você.'],
    'recusar' => ['from' => 'aguardando', 'to' => 'recusada', 'label' => 'Recusar', 'note' => '%s não pôde atender este Projeto. Nenhum valor foi cobrado.'],
    'concluir' => ['from' => 'confirmada', 'to' => 'completed', 'label' => 'Marcar como concluída', 'note' => '%s concluiu o trabalho. Você já pode avaliar a Oferta.'],
  ];
}

// A ação do Prestador: valida sessão, nonce, dono da Contratação e a transição permitida, sempre no servidor.
add_action('template_redirect', function () {
  if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST' || empty($_POST['pd_acao'])) return;
  $orderId = absint($_POST['pd_pedido'] ?? 0);
  $action = sanitize_key(wp_unslash($_POST['pd_acao']));
  $back = wc_get_account_endpoint_url('contratacoes-recebidas');
  $slug = pd_user_provider_slug();
  $order = $orderId ? wc_get_order($orderId) : null;
  $transition = pd_transitions()[$action] ?? null;
  if (!is_user_logged_in() || !$slug || !$order || !$transition || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['_pd_nonce'] ?? '')), "pd_acao_$orderId")) {
    wc_add_notice('Não foi possível registrar a ação. Recarregue a página e tente de novo.', 'error');
  } elseif (pd_order_provider($order)['slug'] !== $slug) {
    wc_add_notice('Esta Contratação não é de uma Oferta sua.', 'error');
  } elseif ($order->get_status() !== $transition['from']) {
    wc_add_notice('Esta Contratação já mudou de situação. A lista abaixo está atualizada.', 'notice');
  } else {
    $name = pd_order_provider($order)['name'];
    $order->update_status($transition['to'], '');
    $order->add_order_note(sprintf($transition['note'], $name), true);
    wc_add_notice(sprintf('Contratação nº %d: %s.', $order->get_id(), mb_strtolower(wc_get_order_status_name($transition['to']))), 'success');
  }
  wp_safe_redirect($back);
  exit;
});

add_action('woocommerce_account_contratacoes-recebidas_endpoint', function () {
  $slug = pd_user_provider_slug();
  if (!$slug) { echo '<p>Esta área é dos Prestadores da loja.</p>'; return; }
  $orders = pd_provider_orders($slug);
  if (!$orders) { echo '<div class="pd-empty"><h2>Nenhuma Contratação ainda</h2><p>Quando um Cliente contratar uma Oferta sua, ela aparece aqui para você confirmar o escopo.</p></div>'; return; }
  echo '<ul class="pd-received">';
  foreach ($orders as $order) {
    $status = $order->get_status();
    $items = implode(', ', array_map(fn ($i) => $i->get_name() . ($i->get_quantity() > 1 ? ' × ' . $i->get_quantity() : ''), array_values($order->get_items())));
    $note = trim((string) $order->get_customer_note());
    echo '<li class="pd-received-item">';
    echo '<div class="pd-received-head"><span class="pd-received-id">Contratação nº ' . (int) $order->get_id() . '</span><span class="pd-status-label pd-status-' . esc_attr($status) . '">' . esc_html(wc_get_order_status_name($status)) . '</span></div>';
    echo '<h3>' . esc_html($items) . '</h3>';
    echo '<p class="pd-received-meta">' . esc_html(trim($order->get_billing_first_name() . ' ' . $order->get_billing_last_name())) . ' · ' . esc_html(wc_format_datetime($order->get_date_created())) . ' · ' . wp_kses_post(wc_price($order->get_total())) . '</p>';
    echo '<p class="pd-received-note">' . ($note ? '<strong>Projeto:</strong> ' . esc_html($note) : '<span>O Cliente não descreveu o Projeto; combine os detalhes antes de confirmar.</span>') . '</p>';
    $buttons = array_filter(pd_transitions(), fn ($t) => $t['from'] === $status);
    if ($buttons) {
      echo '<form method="post" class="pd-received-actions">' . '<input type="hidden" name="pd_pedido" value="' . (int) $order->get_id() . '"><input type="hidden" name="_pd_nonce" value="' . esc_attr(wp_create_nonce('pd_acao_' . $order->get_id())) . '">';
      foreach ($buttons as $key => $t) echo '<button type="submit" name="pd_acao" value="' . esc_attr($key) . '" class="pd-btn ' . ($key === 'recusar' ? 'pd-btn-ghost' : 'pd-btn-primary') . '">' . esc_html($t['label']) . '</button>';
      echo '</form>';
    }
    echo '</li>';
  }
  echo '</ul>';
});

/* ---------------------------------------------------------------- Avaliação verificada */

// Só quem teve a Contratação concluída avalia (opção "apenas proprietários verificados" + só "completed" conta como paga).
add_filter('woocommerce_order_is_paid_statuses', fn () => ['completed']);
add_filter('gettext', function ($translated, $text, $domain) {
  if ($domain !== 'woocommerce') return $translated;
  return match ($text) {
    'verified owner' => 'Contratação verificada',
    'Only logged in customers who have purchased this product may leave a review.' => 'Só quem contratou esta Oferta e teve a Contratação concluída pode avaliar. Entre na sua conta para avaliar.',
    'Orders' => 'Minhas Contratações',
    'No order has been made yet.' => 'Você ainda não contratou nenhuma Oferta.',
    'Browse products' => 'Ver serviços',
    'Order #%1$s was placed on %2$s and is currently %3$s.' => 'A Contratação nº %1$s foi feita em %2$s e está %3$s.',
    'Order updates' => 'Respostas do Prestador',
    'Order details' => 'Detalhes da Contratação',
    'Note:' => 'Projeto:',
    'Order #%s' => 'Contratação nº %s',
    'Order number:' => 'Contratação nº:',
    'Billing address' => 'Seus dados',
    default => $translated,
  };
}, 20, 3);

// Avaliação de quem teve a Contratação concluída é publicada direto (é verificada); as demais seguem a moderação do WordPress.
add_filter('pre_comment_approved', function ($approved, $comment) {
  if (($comment['comment_type'] ?? '') !== 'review' || empty($comment['user_id'])) return $approved;
  return wc_customer_bought_product('', (int) $comment['user_id'], (int) $comment['comment_post_ID']) ? 1 : $approved;
}, 20, 2);

// A loja não envia e-mail (ADR 0006): os endereços da demo não entregam e não há servidor de e-mail.
// O Cliente acompanha a Contratação em "Minhas Contratações"; o Prestador, em "Contratações recebidas".
add_filter('pre_wp_mail', '__return_true');

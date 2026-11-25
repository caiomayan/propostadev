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
      wc_add_notice('Uma Contratação é feita com um Prestador por vez. Conclua a que está no carrinho ou remova o item antes de contratar outro Prestador. <a class="button" href="' . esc_url(wc_get_cart_url()) . '">Ver carrinho</a>', 'error');
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
add_filter('woocommerce_my_account_my_orders_actions', function ($actions, $order) {
  if (isset($actions['view'])) $actions['view']['name'] = 'Ver';
  if (isset($actions['cancel'])) $actions['cancel']['name'] = 'Cancelar Contratação';
  unset($actions['pay'], $actions['order-again']);
  if ($order->get_status() === 'completed') {
    foreach ($order->get_items() as $item) { $actions['avaliar'] = ['url' => get_permalink($item->get_product_id()) . '#tab-reviews', 'name' => 'Avaliar']; break; }
  }
  return $actions;
}, 10, 2);
// Sem e-mail, o pedido de "confirme seu e-mail para ver pedidos anteriores" seria um beco sem saída.
add_action('wp', fn () => remove_all_actions('woocommerce_before_account_orders'));

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
  echo '<p>' . esc_html($help) . '</p>';
  $links = [];
  foreach ($order->get_items() as $item) {
    $product = $item->get_product();
    if (!$product) continue;
    if ($order->get_status() === 'completed') $links[] = '<a class="pd-btn pd-btn-primary" href="' . esc_url(get_permalink($item->get_product_id()) . '#tab-reviews') . '">Avaliar a Oferta</a>';
    if ($product->get_meta('_pd_prestador_slug')) $links[] = '<a class="pd-btn pd-btn-ghost" href="' . esc_url(PROPOSTADEV_SITE . '/prestadores/' . rawurlencode((string) $product->get_meta('_pd_prestador_slug'))) . '" target="_blank" rel="noopener">Ver perfil e contato do Prestador</a>';
    break;
  }
  if ($links) echo '<p class="pd-actions">' . implode('', $links) . '</p>';
  echo '</div>';
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
    $phone = $order->get_billing_phone();
    echo '<p class="pd-received-contact">Contato do Cliente: <a href="mailto:' . esc_attr($order->get_billing_email()) . '">' . esc_html($order->get_billing_email()) . '</a>' . ($phone ? ' · <a href="tel:' . esc_attr(preg_replace('/\D+/', '', $phone)) . '">' . esc_html($phone) . '</a>' : '') . '</p>';
    echo '<p class="pd-received-note">' . ($note ? '<strong>Projeto:</strong> ' . esc_html($note) : '<span>O Cliente não descreveu o Projeto; combine os detalhes antes de confirmar.</span>') . '</p>';
    $buttons = array_filter(pd_transitions(), fn ($t) => $t['from'] === $status);
    if ($buttons) {
      echo '<form method="post" class="pd-received-actions">' . '<input type="hidden" name="pd_pedido" value="' . (int) $order->get_id() . '"><input type="hidden" name="_pd_nonce" value="' . esc_attr(wp_create_nonce('pd_acao_' . $order->get_id())) . '">';
      foreach ($buttons as $key => $t) {
        $confirm = $key === 'recusar' ? ' onclick="return confirm(\'Recusar a Contratação nº ' . (int) $order->get_id() . '? O Cliente vê a recusa e isso não pode ser desfeito.\')"' : ($key === 'concluir' ? ' onclick="return confirm(\'Marcar a Contratação nº ' . (int) $order->get_id() . ' como concluída? O Cliente passa a poder avaliar.\')"' : '');
        echo '<button type="submit" name="pd_acao" value="' . esc_attr($key) . '" class="pd-btn ' . ($key === 'recusar' ? 'pd-btn-ghost' : 'pd-btn-primary') . '"' . $confirm . '>' . esc_html($t['label']) . '</button>';
      }
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


/* ---------------------------------------------------------------- Experiência de conta */

// Depois do login: o Prestador vai direto às Contratações recebidas; o Cliente volta para onde estava.
add_filter('woocommerce_login_redirect', fn ($redirect, $user) => pd_user_provider_slug($user) ? wc_get_account_endpoint_url('contratacoes-recebidas') : $redirect, 10, 2);
// O formulário carrega a página de origem (?redirect=) para o WooCommerce voltar a ela; só endereços desta loja.
add_action('woocommerce_login_form', function () {
  $to = isset($_GET['redirect']) ? wp_validate_redirect(esc_url_raw(rawurldecode(wp_unslash($_GET['redirect']))), '') : '';
  if ($to) echo '<input type="hidden" name="redirect" value="' . esc_url($to) . '">';
});
add_action('woocommerce_register_form', function () {
  $to = isset($_GET['redirect']) ? wp_validate_redirect(esc_url_raw(rawurldecode(wp_unslash($_GET['redirect']))), '') : '';
  if ($to) echo '<input type="hidden" name="pd_redirect" value="' . esc_url($to) . '">';
});
add_filter('woocommerce_registration_redirect', function ($redirect) {
  $to = isset($_POST['pd_redirect']) ? wp_validate_redirect(esc_url_raw(wp_unslash($_POST['pd_redirect'])), '') : '';
  return $to ?: wc_get_account_endpoint_url('dashboard');
});

// Prestador logado não contrata (papéis separados, como no site): a página explica em vez de mostrar o botão.
add_filter('woocommerce_is_purchasable', fn ($ok) => pd_user_provider_slug() ? false : $ok, 20);
add_action('woocommerce_single_product_summary', function () {
  if (!pd_user_provider_slug()) return;
  echo '<p class="pd-note pd-role-note">Você está como Prestador. Para contratar, saia e entre com uma conta de Cliente. <a href="' . esc_url(wc_get_account_endpoint_url('contratacoes-recebidas')) . '">Ver Contratações recebidas</a> · <a href="' . esc_url(wc_logout_url(get_permalink())) . '">Sair</a></p>';
}, 31);

// Sem e-mail, a recuperação de senha não chegaria: o link sai e a tela de login diz o que fazer.
add_filter('lostpassword_url', fn () => '');
add_action('woocommerce_login_form_end', function () {
  echo '<p class="pd-note">Esqueceu a senha? Esta loja de demonstração não envia e-mail; fale com a Equipe da plataforma.</p>';
});
add_action('woocommerce_before_customer_login_form', function () {
  echo '<p class="pd-login-lead">Entre para acompanhar suas Contratações. Ainda não tem conta? Crie ao lado: leva menos de um minuto. Quer oferecer serviços? <a href="https://propostadev-one.vercel.app/cadastro">Cadastre-se como Prestador no Proposta.dev</a>.</p>';
});
add_filter('the_title', function ($title, $id = 0) {
  if (!is_user_logged_in() && function_exists('is_account_page') && is_account_page() && (int) $id === (int) wc_get_page_id('myaccount') && in_the_loop()) return 'Entrar ou criar conta';
  return $title;
}, 10, 2);
add_filter('gettext', function ($translated, $text, $domain) {
  if ($domain !== 'woocommerce') return $translated;
  return match ($text) {
    'Login' => 'Entrar',
    'Register' => 'Criar conta',
    'Log in' => 'Entrar',
    default => $translated,
  };
}, 30, 3);


/* ---------------------------------------------------------------- Contratação (checkout clássico) */

// Serviço digital: sem endereço postal. O que importa é quem contrata e o Projeto, que o Prestador confirma.
add_filter('woocommerce_checkout_fields', function ($fields) {
  foreach (['billing_company', 'billing_address_1', 'billing_address_2', 'billing_city', 'billing_state', 'billing_postcode', 'billing_country'] as $f) unset($fields['billing'][$f]);
  if (isset($fields['billing']['billing_phone'])) { $fields['billing']['billing_phone']['required'] = false; $fields['billing']['billing_phone']['label'] = 'Telefone ou WhatsApp'; }
  if (isset($fields['order']['order_comments'])) {
    $fields['order']['order_comments']['required'] = true;
    $fields['order']['order_comments']['label'] = 'Descreva seu Projeto';
    $fields['order']['order_comments']['placeholder'] = 'O que você precisa, para quando e qualquer referência útil. O Prestador usa isto para confirmar o escopo.';
  }
  return $fields;
}, 20);
add_filter('woocommerce_billing_fields', function ($fields) {
  if (is_checkout()) foreach (['billing_address_1', 'billing_address_2', 'billing_city', 'billing_state', 'billing_postcode', 'billing_country', 'billing_company'] as $f) unset($fields[$f]);
  return $fields;
}, 20);
add_filter('woocommerce_enable_order_notes_field', '__return_true');
add_filter('woocommerce_order_button_text', fn () => 'Confirmar Contratação');
add_filter('woocommerce_cart_needs_shipping_address', '__return_false');
add_filter('gettext', function ($translated, $text, $domain) {
  if ($domain !== 'woocommerce') return $translated;
  return match ($text) {
    'Billing details' => 'Seus dados',
    'Your order' => 'Sua Contratação',
    'Additional information' => 'Sobre o Projeto',
    'Returning customer?' => 'Já tem conta?',
    'Click here to login' => 'Entrar',
    'Create an account?' => 'Criar uma conta para acompanhar a Contratação',
    'Continue shopping' => 'Ver mais serviços',
    'Your review' => 'Como foi a Contratação?',
    'Proceed to checkout' => 'Ir para a Contratação',
    'Product' => 'Oferta',
    'From your account dashboard you can view your <a href="%1$s">recent orders</a>, manage your <a href="%2$s">billing address</a>, and <a href="%3$s">edit your password and account details</a>.' => '',
    'From your account dashboard you can view your <a href="%1$s">recent orders</a>, manage your <a href="%2$s">shipping and billing addresses</a>, and <a href="%3$s">edit your password and account details</a>.' => '',
    default => $translated,
  };
}, 40, 3);

// Confirmação antes de o Cliente cancelar (não dá para desfazer).
add_action('wp_footer', function () {
  if (!is_account_page()) return;
  echo "<script>document.querySelectorAll('a.cancel').forEach(a=>a.addEventListener('click',e=>{if(!confirm('Cancelar esta Contratação? O Prestador deixa de vê-la e isso não pode ser desfeito.'))e.preventDefault()}));</script>";
});

/* ---------------------------------------------------------------- Prestador: Minhas Ofertas
 * O Prestador cria, edita, pausa e reativa as próprias Ofertas na loja, com as mesmas regras do formulário do site
 * (src/modules/offers/validation.ts): título 5–120, descrição 30–5000, preço e prazo por modelo, e uma Oferta ativa por
 * Tipo de serviço. O cadastro do Prestador (Perfil, PF/PJ, contatos, Selo) continua na plataforma (ADR 0006). */

const PD_PRICE_TYPES = ['FIXO' => 'Preço fixo', 'A_PARTIR_DE' => 'A partir de', 'INTERVALO' => 'Intervalo de preços', 'POR_HORA' => 'Por hora', 'SOB_CONSULTA' => 'Sob consulta'];
const PD_DEADLINE_TYPES = ['FIXO' => 'Prazo fixo', 'A_PARTIR_DE' => 'A partir de', 'INTERVALO' => 'Intervalo de dias', 'A_COMBINAR' => 'A combinar'];

add_action('init', fn () => add_rewrite_endpoint('minhas-ofertas', EP_ROOT | EP_PAGES));
add_filter('woocommerce_get_query_vars', fn ($vars) => $vars + ['minhas-ofertas' => 'minhas-ofertas']);
add_filter('woocommerce_endpoint_minhas-ofertas_title', fn () => 'Minhas Ofertas');
add_filter('woocommerce_account_menu_items', function ($items) {
  if (!pd_user_provider_slug()) return $items;
  $out = [];
  foreach ($items as $k => $v) { $out[$k] = $v; if ($k === 'contratacoes-recebidas') $out['minhas-ofertas'] = 'Minhas Ofertas'; }
  return $out;
}, 30);

function pd_provider_products(string $slug): array {
  return $slug ? wc_get_products(['limit' => 100, 'status' => ['publish', 'draft'], 'meta_key' => '_pd_prestador_slug', 'meta_value' => $slug, 'orderby' => 'title', 'order' => 'ASC']) : [];
}

function pd_service_types(): array {
  $out = [];
  foreach (pd_top_categories() as $cat) foreach (get_terms(['taxonomy' => 'product_cat', 'parent' => $cat->term_id, 'hide_empty' => false]) as $t) $out[$t->term_id] = [$t, $cat];
  return $out;
}

function pd_product_type_id(WC_Product $p): int {
  foreach ($p->get_category_ids() as $id) { $t = get_term($id, 'product_cat'); if ($t && $t->parent) return (int) $id; }
  return 0;
}

function pd_money(string $raw): ?string {
  $v = trim($raw);
  if ($v === '') return null;
  if (str_contains($v, ',')) $v = str_replace(',', '.', str_replace('.', '', $v));
  return preg_match('/^\d{1,8}(?:\.\d{1,2})?$/', $v) && (float) $v > 0 ? number_format((float) $v, 2, '.', '') : 'invalido';
}

function pd_days(string $raw): ?int {
  $v = trim($raw);
  if ($v === '') return null;
  return ctype_digit($v) && (int) $v >= 1 && (int) $v <= 3650 ? (int) $v : -1;
}

// Mesmas regras de src/modules/offers/validation.ts. Devolve [dados normalizados, erros por campo].
function pd_validate_offer(array $in, string $slug, int $editingId): array {
  $e = [];
  $title = trim(sanitize_text_field($in['titulo'] ?? ''));
  $desc = trim(sanitize_textarea_field($in['descricao'] ?? ''));
  $typeId = absint($in['tipo'] ?? 0);
  $pt = (string) ($in['tipo_preco'] ?? '');
  $dt = (string) ($in['tipo_prazo'] ?? '');
  $pmin = pd_money((string) ($in['preco_min'] ?? ''));
  $pmax = pd_money((string) ($in['preco_max'] ?? ''));
  $dmin = pd_days((string) ($in['prazo_min'] ?? ''));
  $dmax = pd_days((string) ($in['prazo_max'] ?? ''));
  $active = !empty($in['ativa']);
  if (mb_strlen($title) < 5 || mb_strlen($title) > 120) $e['titulo'] = 'Use de 5 a 120 caracteres.';
  if (mb_strlen($desc) < 30 || mb_strlen($desc) > 5000) $e['descricao'] = 'Descreva o que está incluído em 30 a 5.000 caracteres.';
  if (!isset(pd_service_types()[$typeId])) $e['tipo'] = 'Escolha o Tipo de serviço.';
  if (!isset(PD_PRICE_TYPES[$pt])) $e['tipo_preco'] = 'Escolha o modelo de preço.';
  if (!isset(PD_DEADLINE_TYPES[$dt])) $e['tipo_prazo'] = 'Escolha o modelo de prazo.';
  if ($pmin === 'invalido') $e['preco_min'] = 'Informe um valor positivo, como 1500 ou 1.500,00.';
  if ($pmax === 'invalido') $e['preco_max'] = 'Informe um valor positivo, como 3000 ou 3.000,00.';
  if ($pt === 'SOB_CONSULTA') { if ($pmin !== null || $pmax !== null) $e['preco_min'] = 'Sob consulta não aceita valores.'; }
  elseif (isset(PD_PRICE_TYPES[$pt]) && !isset($e['preco_min'])) {
    if ($pmin === null) $e['preco_min'] = 'Informe o preço mínimo.';
    if ($pt === 'INTERVALO') { if ($pmax === null) $e['preco_max'] = 'Informe o preço máximo.'; elseif (!isset($e['preco_max']) && $pmin !== null && (float) $pmax < (float) $pmin) $e['preco_max'] = 'O máximo deve ser maior ou igual ao mínimo.'; }
    elseif ($pmax !== null && !isset($e['preco_max'])) $e['preco_max'] = 'Este modelo não aceita valor máximo.';
  }
  if ($dmin === -1) $e['prazo_min'] = 'Use de 1 a 3.650 dias.';
  if ($dmax === -1) $e['prazo_max'] = 'Use de 1 a 3.650 dias.';
  if ($dt === 'A_COMBINAR') { if ($dmin !== null || $dmax !== null) $e['prazo_min'] = 'A combinar não aceita quantidade de dias.'; }
  elseif (isset(PD_DEADLINE_TYPES[$dt]) && !isset($e['prazo_min'])) {
    if ($dmin === null) $e['prazo_min'] = 'Informe o prazo mínimo.';
    if ($dt === 'INTERVALO') { if ($dmax === null) $e['prazo_max'] = 'Informe o prazo máximo.'; elseif (!isset($e['prazo_max']) && $dmin !== null && $dmax < $dmin) $e['prazo_max'] = 'O máximo deve ser maior ou igual ao mínimo.'; }
    elseif ($dmax !== null && !isset($e['prazo_max'])) $e['prazo_max'] = 'Este modelo não aceita prazo máximo.';
  }
  if ($active && !isset($e['tipo'])) {
    foreach (pd_provider_products($slug) as $p) {
      if ($p->get_id() !== $editingId && $p->get_status() === 'publish' && pd_product_type_id($p) === $typeId) { $e['tipo'] = 'Você já tem uma Oferta ativa deste Tipo de serviço (' . $p->get_name() . '). Pause a outra ou salve esta como pausada.'; break; }
    }
  }
  return [compact('title', 'desc', 'typeId', 'pt', 'dt', 'pmin', 'pmax', 'dmin', 'dmax', 'active'), $e];
}

function pd_save_offer(array $d, string $slug, ?WC_Product $product): int {
  $model = pd_provider_products($slug)[0] ?? null; // copia os dados do Prestador de uma Oferta dele
  $brand = get_term_by('slug', $slug, 'product_brand');
  [$type, $cat] = pd_service_types()[$d['typeId']];
  $product = $product ?: new WC_Product_Simple();
  $product->set_name($d['title']);
  $product->set_description(wpautop(esc_html($d['desc'])));
  $product->set_short_description(esc_html($type->name . ' por ' . ($brand ? $brand->name : '') . '.'));
  $product->set_status($d['active'] ? 'publish' : 'draft');
  $product->set_virtual(true);
  $product->set_sold_individually($d['pt'] !== 'POR_HORA');
  $product->set_regular_price($d['pt'] === 'SOB_CONSULTA' ? '' : (string) $d['pmin']);
  $product->set_category_ids([$cat->term_id, $type->term_id]);
  $product->set_reviews_allowed(true);
  if (!$product->get_image_id() || pd_product_type_id($product) !== $d['typeId']) {
    $thumb = (int) get_term_meta($type->term_id, 'thumbnail_id', true);
    if ($thumb && !$product->get_meta('_pd_oferta_id')) $product->set_image_id($thumb);
  }
  $meta = ['_pd_tipo_preco' => $d['pt'], '_pd_preco_minimo' => $d['pmin'] ?? '', '_pd_preco_maximo' => $d['pmax'] ?? '', '_pd_tipo_prazo' => $d['dt'], '_pd_prazo_minimo' => $d['dmin'] ?? '', '_pd_prazo_maximo' => $d['dmax'] ?? '', '_pd_prestador_slug' => $slug];
  if ($model) foreach (['_pd_prestador', '_pd_vip', '_pd_foto', '_pd_local', '_pd_anos'] as $k) if (!$product->get_meta($k)) $meta[$k] = $model->get_meta($k);
  foreach ($meta as $k => $v) $product->update_meta_data($k, $v);
  $id = $product->save();
  if ($brand) wp_set_object_terms($id, [$brand->term_id], 'product_brand');
  return $id;
}

// Salvar, pausar e reativar: sessão, nonce e dono conferidos no servidor.
add_action('template_redirect', function () {
  if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST' || empty($_POST['pd_oferta_acao'])) return;
  $slug = pd_user_provider_slug();
  $list = wc_get_account_endpoint_url('minhas-ofertas');
  $id = absint($_POST['pd_oferta'] ?? 0);
  $product = $id ? wc_get_product($id) : null;
  if (!$slug || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['_pd_nonce'] ?? '')), 'pd_oferta_' . $id) || ($id && (!$product || $product->get_meta('_pd_prestador_slug') !== $slug))) {
    wc_add_notice('Não foi possível salvar. Recarregue a página e tente de novo.', 'error'); wp_safe_redirect($list); exit;
  }
  $action = sanitize_key(wp_unslash($_POST['pd_oferta_acao']));
  if ($action === 'pausar' && $product) { $product->set_status('draft'); $product->save(); wc_add_notice('Oferta pausada: ela saiu do catálogo e não recebe novas Contratações.', 'success'); wp_safe_redirect($list); exit; }
  if ($action === 'reativar' && $product) {
    [, $e] = pd_validate_offer(['titulo' => $product->get_name(), 'descricao' => wp_strip_all_tags($product->get_description()), 'tipo' => pd_product_type_id($product), 'tipo_preco' => $product->get_meta('_pd_tipo_preco'), 'tipo_prazo' => $product->get_meta('_pd_tipo_prazo'), 'preco_min' => (string) $product->get_meta('_pd_preco_minimo'), 'preco_max' => (string) $product->get_meta('_pd_preco_maximo'), 'prazo_min' => (string) $product->get_meta('_pd_prazo_minimo'), 'prazo_max' => (string) $product->get_meta('_pd_prazo_maximo'), 'ativa' => 1], $slug, $product->get_id());
    if ($e) { wc_add_notice(implode(' ', $e), 'error'); } else { $product->set_status('publish'); $product->save(); wc_add_notice('Oferta reativada: ela voltou ao catálogo.', 'success'); }
    wp_safe_redirect($list); exit;
  }
  if ($action === 'salvar') {
    $in = wp_unslash($_POST);
    [$d, $e] = pd_validate_offer($in, $slug, $id);
    if ($e) { $GLOBALS['pd_offer_errors'] = $e; $GLOBALS['pd_offer_input'] = $in; wc_add_notice('Revise os campos marcados.', 'error'); return; }
    $saved = pd_save_offer($d, $slug, $product);
    wc_add_notice($d['active'] ? 'Oferta publicada. <a href="' . esc_url(get_permalink($saved)) . '">Ver como o Cliente vê</a>' : 'Oferta salva como pausada: ela só aparece no catálogo quando você reativar.', 'success');
    wp_safe_redirect($list); exit;
  }
});

add_action('woocommerce_account_minhas-ofertas_endpoint', function () {
  $slug = pd_user_provider_slug();
  if (!$slug) { echo '<p>Esta área é dos Prestadores da loja.</p>'; return; }
  $editing = isset($_GET['editar']) ? absint($_GET['editar']) : null;
  $new = isset($_GET['nova']) || isset($GLOBALS['pd_offer_errors']) && !absint($_POST['pd_oferta'] ?? 0);
  if ($editing || $new || isset($GLOBALS['pd_offer_errors'])) { pd_offer_form($slug, $editing ?: absint($_POST['pd_oferta'] ?? 0)); return; }
  echo '<div class="pd-offers-head"><p>Estas são as suas Ofertas na loja. Seu Perfil, contatos e Selo de confiança ficam no <a href="' . esc_url(PROPOSTADEV_SITE . '/painel') . '">painel do Proposta.dev</a>.</p><a class="pd-btn pd-btn-primary" href="' . esc_url(add_query_arg('nova', '1', wc_get_account_endpoint_url('minhas-ofertas'))) . '">Nova Oferta</a></div>';
  $products = pd_provider_products($slug);
  if (!$products) { echo '<div class="pd-empty"><h2>Nenhuma Oferta ainda</h2><p>Crie a primeira: Clientes contratam pelo preço e prazo que você definir.</p></div>'; return; }
  echo '<ul class="pd-received">';
  foreach ($products as $p) {
    $live = $p->get_status() === 'publish';
    $type = get_term(pd_product_type_id($p), 'product_cat');
    echo '<li class="pd-received-item"><div class="pd-received-head"><span class="pd-received-id">' . esc_html($type && !is_wp_error($type) ? $type->name : '') . '</span><span class="pd-status-label ' . ($live ? 'pd-status-confirmada' : '') . '">' . ($live ? 'Ativa' : 'Pausada') . '</span></div>';
    echo '<h3>' . esc_html($p->get_name()) . '</h3><p class="pd-received-meta">' . wp_kses_post($p->get_price_html()) . ' · ' . esc_html(pd_prazo($p)) . ' · ' . sprintf(_n('%d Avaliação', '%d Avaliações', $p->get_review_count()), $p->get_review_count()) . '</p>';
    echo '<form method="post" class="pd-received-actions"><input type="hidden" name="pd_oferta" value="' . (int) $p->get_id() . '"><input type="hidden" name="_pd_nonce" value="' . esc_attr(wp_create_nonce('pd_oferta_' . $p->get_id())) . '">';
    echo '<a class="pd-btn pd-btn-primary" href="' . esc_url(add_query_arg('editar', $p->get_id(), wc_get_account_endpoint_url('minhas-ofertas'))) . '">Editar</a>';
    echo $live ? '<button class="pd-btn pd-btn-ghost" name="pd_oferta_acao" value="pausar" onclick="return confirm(\'Pausar esta Oferta? Ela sai do catálogo até você reativar.\')">Pausar</button><a class="pd-link" href="' . esc_url(get_permalink($p->get_id())) . '">Ver no catálogo' . pd_icon('arrow') . '</a>' : '<button class="pd-btn pd-btn-ghost" name="pd_oferta_acao" value="reativar">Reativar</button>';
    echo '</form></li>';
  }
  echo '</ul>';
});

function pd_offer_form(string $slug, int $id): void {
  $p = $id ? wc_get_product($id) : null;
  if ($p && $p->get_meta('_pd_prestador_slug') !== $slug) { echo '<p>Esta Oferta não é sua.</p>'; return; }
  $in = $GLOBALS['pd_offer_input'] ?? ($p ? ['titulo' => $p->get_name(), 'descricao' => wp_strip_all_tags($p->get_description()), 'tipo' => pd_product_type_id($p), 'tipo_preco' => $p->get_meta('_pd_tipo_preco'), 'tipo_prazo' => $p->get_meta('_pd_tipo_prazo'), 'preco_min' => (string) $p->get_meta('_pd_preco_minimo'), 'preco_max' => (string) $p->get_meta('_pd_preco_maximo'), 'prazo_min' => (string) $p->get_meta('_pd_prazo_minimo'), 'prazo_max' => (string) $p->get_meta('_pd_prazo_maximo'), 'ativa' => $p->get_status() === 'publish'] : ['tipo_preco' => 'FIXO', 'tipo_prazo' => 'FIXO', 'ativa' => 1]);
  $e = $GLOBALS['pd_offer_errors'] ?? [];
  $err = fn ($k) => isset($e[$k]) ? '<span class="pd-field-error" id="erro-' . $k . '">' . esc_html($e[$k]) . '</span>' : '';
  $attrs = fn ($k) => isset($e[$k]) ? ' aria-invalid="true" aria-describedby="erro-' . $k . '"' : '';
  $v = fn ($k) => esc_attr((string) ($in[$k] ?? ''));
  echo '<p><a class="pd-link" href="' . esc_url(wc_get_account_endpoint_url('minhas-ofertas')) . '">← Voltar para Minhas Ofertas</a></p>';
  echo '<form method="post" class="pd-offer-form" novalidate><h2>' . ($p ? 'Editar Oferta' : 'Nova Oferta') . '</h2>';
  echo '<input type="hidden" name="pd_oferta" value="' . (int) $id . '"><input type="hidden" name="_pd_nonce" value="' . esc_attr(wp_create_nonce('pd_oferta_' . $id)) . '"><input type="hidden" name="pd_oferta_acao" value="salvar">';
  echo '<p class="form-row"><label for="pd-titulo">Título</label><input id="pd-titulo" name="titulo" maxlength="120" value="' . $v('titulo') . '"' . $attrs('titulo') . '>' . $err('titulo') . '</p>';
  echo '<p class="form-row"><label for="pd-tipo">Tipo de serviço</label><select id="pd-tipo" name="tipo"' . $attrs('tipo') . '><option value="">Escolha</option>';
  foreach (pd_service_types() as $tid => [$t, $c]) echo '<option value="' . (int) $tid . '"' . selected((int) ($in['tipo'] ?? 0), $tid, false) . '>' . esc_html($c->name . ' · ' . $t->name) . '</option>';
  echo '</select>' . $err('tipo') . '</p>';
  echo '<p class="form-row"><label for="pd-descricao">O que está incluído</label><textarea id="pd-descricao" name="descricao" rows="5" maxlength="5000"' . $attrs('descricao') . '>' . esc_textarea((string) ($in['descricao'] ?? '')) . '</textarea>' . $err('descricao') . '</p>';
  echo '<fieldset class="pd-fieldset"><legend>Preço</legend><p class="form-row"><label for="pd-tipo-preco">Modelo</label><select id="pd-tipo-preco" name="tipo_preco">';
  foreach (PD_PRICE_TYPES as $k => $l) echo '<option value="' . $k . '"' . selected($in['tipo_preco'] ?? '', $k, false) . '>' . esc_html($l) . '</option>';
  echo '</select></p><div class="pd-pair"><p class="form-row"><label for="pd-preco-min">Valor (mínimo) em R$</label><input id="pd-preco-min" name="preco_min" inputmode="decimal" placeholder="1.500,00" value="' . $v('preco_min') . '"' . $attrs('preco_min') . '>' . $err('preco_min') . '</p>';
  echo '<p class="form-row"><label for="pd-preco-max">Valor máximo em R$ (só intervalo)</label><input id="pd-preco-max" name="preco_max" inputmode="decimal" placeholder="3.000,00" value="' . $v('preco_max') . '"' . $attrs('preco_max') . '>' . $err('preco_max') . '</p></div>';
  echo '<small class="pd-note">Por hora é R$/hora; os demais modelos são R$ por projeto. Sob consulta não leva valores.</small></fieldset>';
  echo '<fieldset class="pd-fieldset"><legend>Prazo</legend><p class="form-row"><label for="pd-tipo-prazo">Modelo</label><select id="pd-tipo-prazo" name="tipo_prazo">';
  foreach (PD_DEADLINE_TYPES as $k => $l) echo '<option value="' . $k . '"' . selected($in['tipo_prazo'] ?? '', $k, false) . '>' . esc_html($l) . '</option>';
  echo '</select></p><div class="pd-pair"><p class="form-row"><label for="pd-prazo-min">Dias (mínimo)</label><input id="pd-prazo-min" name="prazo_min" inputmode="numeric" value="' . $v('prazo_min') . '"' . $attrs('prazo_min') . '>' . $err('prazo_min') . '</p>';
  echo '<p class="form-row"><label for="pd-prazo-max">Dias máximo (só intervalo)</label><input id="pd-prazo-max" name="prazo_max" inputmode="numeric" value="' . $v('prazo_max') . '"' . $attrs('prazo_max') . '>' . $err('prazo_max') . '</p></div>';
  echo '<small class="pd-note">A combinar não leva dias.</small></fieldset>';
  echo '<p class="form-row pd-check"><label><input type="checkbox" name="ativa" value="1"' . checked(!empty($in['ativa']), true, false) . '> Publicar no catálogo (só uma Oferta ativa por Tipo de serviço)</label></p>';
  echo '<p class="pd-actions"><button class="pd-btn pd-btn-primary" type="submit">' . ($p ? 'Salvar alterações' : 'Criar Oferta') . '</button><a class="pd-btn pd-btn-ghost" href="' . esc_url(wc_get_account_endpoint_url('minhas-ofertas')) . '">Cancelar</a></p></form>';
}

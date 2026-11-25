<?php
// Página "Termos e privacidade" da loja (usada no cadastro e na Contratação) e textos de privacidade em português. Idempotente.
$content = '<p>Esta loja é a versão e-commerce do Proposta.dev, um projeto acadêmico em demonstração. Prestadores, Ofertas e Avaliações exibidos são fictícios.</p>'
  . '<h2>Contratação</h2><p>Contratar uma Oferta não cobra nenhum valor. A Contratação chega ao Prestador, que confirma o escopo, o valor final e combina o pagamento diretamente com você. Nenhum pagamento é processado nesta loja.</p>'
  . '<h2>Seus dados</h2><p>Usamos nome, e-mail e os dados informados na Contratação apenas para criar sua conta e mostrar suas Contratações a você e ao Prestador escolhido. A loja não envia e-mails e não compartilha dados com terceiros.</p>'
  . '<p>A política completa da plataforma está em <a href="https://propostadev-one.vercel.app/privacidade">propostadev-one.vercel.app/privacidade</a>.</p>';
$page = get_page_by_path('termos-e-privacidade');
$id = $page ? $page->ID : wp_insert_post(['post_type' => 'page', 'post_status' => 'publish', 'post_title' => 'Termos e privacidade', 'post_name' => 'termos-e-privacidade', 'post_content' => $content]);
if ($page) wp_update_post(['ID' => $id, 'post_content' => $content, 'post_status' => 'publish']);
update_option('wp_page_for_privacy_policy', $id);
update_option('woocommerce_terms_page_id', $id);
update_option('woocommerce_registration_privacy_policy_text', 'Seus dados são usados apenas para sua conta e suas Contratações nesta loja de demonstração. Veja a [privacy_policy].');
update_option('woocommerce_checkout_privacy_policy_text', 'Seus dados são usados apenas para esta Contratação e sua conta. Veja a [privacy_policy].');
update_option('woocommerce_checkout_terms_and_conditions_checkbox_text', 'Li e concordo com os [terms]');
WP_CLI::success('Página Termos e privacidade publicada.');

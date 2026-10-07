# Plano de aceite e definição de pronto

## Gates automatizados
pnpm lint; pnpm typecheck; pnpm test; pnpm test:integration; pnpm test:e2e; pnpm build. Scripts devem existir e falhar quando algo relevante quebra. Não basta renomear comandos vazios. Testes de integração contra PostgreSQL de teste e E2E com base isolada. Se ambiente não suportar um gate, registrar não executado, razão e comando para o usuário; não reportar como passou.

## Cenários essenciais
| ID | Given / When / Then | RF |
|---|---|---|
| AC01 | Banco vazio → migrations + seed duas vezes → catálogo único e app funcional. | RF12 |
| AC02 | Visitante cadastra/entra/sai → páginas privadas e actions respeitam sessão real. | RF02 |
| AC03 | Conta A cria perfil PF → mantém capacidade de buscar/avaliar outros. | RF03 |
| AC04 | Conta B tenta editar perfil/oferta de A por payload/URL → sem mudança no banco. | RF04,05,12 |
| AC05 | Prestador publica preço/prazo em cada modelo → formatação e checks corretos. | RF06 |
| AC06 | Dois anúncios ativos concorrentes no mesmo par → só um ativo; erro legível. | RF05 |
| AC07 | Nome/título com acento → pesquisa com e sem acento encontra; paginação sem duplicação. | RF01,07 |
| AC08 | Mesmo perfil tem uma oferta barata e outra rápida → filtro combinado não usa duas ofertas para fabricar match. | RF07 |
| AC09 | Filtrar por prazo até 7 → intervalo 3–5 incluído, 3–9 excluído, 7+ e a combinar excluídos. | RF07 |
| AC10 | Comparar 3 → quarto recusado; recarregar preserva IDs e revalida dados; perfis distintos. | RF08 |
| AC11 | Usuário avalia terceiro → nota aparece; segunda avaliação não duplica; editar/deletar recalcula. | RF09,10 |
| AC12 | Dono tenta autoavaliar por action e SQL → ambos recusados. | RF10,12 |
| AC13 | FIXO 800/1000/1200 → média 1000 n3; 100/h, 1500+ e faixas não entram. | RF11 |
| AC14 | Dois prestadores elegíveis → média numérica ausente; mensagem de dados insuficientes. | RF11 |
| AC15 | Perfil desativado ou oferta excluída → ausentes de busca/estatística/comparação; preservados no painel. | RF04,05 |
| AC16 | E-mail de login difere do público → somente público sai no perfil; token/hash não saem em respostas/logs. | RF09,12 |
| AC17 | Reiniciar app e container sem apagar volume → contas/ofertas permanecem. | RF12 |
| AC18 | Catálogo vazio e perfil sem avaliações/foto → estados úteis, sem fake data no runtime. | RF01,09 |

## QA manual/visual
Home, busca filtrada, perfil, comparação, cadastro/login, edição de perfil e oferta em 375/768/1440px. Verificar contraste, foco, teclado, labels, mensagens de erro, loading, dados extensos, links reais, URLs perigosas rejeitadas, ausência de overflow. Sem texto placeholder, CTA sem ação, layout genérico com gradiente ou depoimentos inventados.

## Definition of Done
Todos os must-have integrados ao banco; código auth real; migrations e seeds versionados; checagem de dono em cada mutation; nenhum secret comitado; README operacional com passos exatos; evidências dos gates; dependências/lockfile registrados; documentação consistente com código. Qualquer gate não executado ou requisito parcial aparece como limitação explícita. Publicação em nuvem não compõe este aceite.

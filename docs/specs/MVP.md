# Especificação comportamental SDD — MVP

## S01 Contas e autorização (RF02, RF12)
Cadastro nome 2–100 chars, e-mail válido normalizado e senha 12–128. Mensagens de login não distinguem conta inexistente de senha incorreta. Login redireciona para destino interno validado (sem open redirect). Logout remove acesso privado. Perfil prestador usa usuário da sessão, nunca escolhido pelo formulário. Conta pode editar nome e trocar senha pela API de auth, sem mudança de email na V1.

Visitante tem leitura pública; usuário tem leitura/edição de conta própria e avaliação de terceiros; dono do perfil pode gerir perfil e ofertas; ninguém pode alterar outro usuário. Rotas privadas redirecionam a entrar, mutations sem auth recusam mesmo que a UI esteja escondida.

## S02 Perfil (RF03, RF04, RF09)
Campos obrigatórios ao criar/publicar: tipo PF/PJ, nome_exibicao 2–100, descricao 30–5.000, anos_experiencia inteiro 0–80, email_contato válido, consentimento para publicação dos contatos. Slug gerado a partir do nome + sufixo curto, único e imutável na V1. Usuário não informa dono. Permitir rascunho apenas se existir estratégia consistente: nesta V1 criação exige os obrigatórios, perfil nasce ativo.

Opcionais: foto_url, cidade, uf, pais (default BR), telefone (E.164), whatsapp (E.164), site_url, github_url, linkedin_url. URLs até 2.048 chars HTTPS. UF deve ter 2 letras se país BR; localização ausente mostra “Localização não informada”, não assumir presença física/remoto verificado. Experiência e PF/PJ autodeclaradas. Link WhatsApp usa dígitos E.164 sem + em wa.me; email usa mailto; telefone tel. Sem texto pré-preenchido com dados sensíveis.

Desativar perfil o remove de busca, estatísticas, comparação válida e rota pública (404); preserva ofertas/avaliações no banco. Reativar o torna disponível com ofertas ainda ativas. Essa decisão deve ser explícita no diálogo. Perfil ativo sem ofertas pode ser acessado por URL, mas não aparece na busca.

## S03 Catálogo/ofertas (RF05, RF06)
Categoria 1:N tipo_servico; tipo_servico 1:N oferta; perfil 1:N oferta. Catálogo somente seed/admin técnico, sem criação arbitrária por prestador. Oferta: título 5–120, descrição 30–5.000, tipo de serviço ativo, tipo_preco, min/max, tipo_prazo, dias min/max, ativo, deleted_at. Rascunho/pausada não pública. Valor positivo no máximo 99.999.999,99; decimal duas casas. Prazo inteiro 1–3.650 dias quando informado.

| Modelo preço | mínimo | máximo |
|---|---|---|
| FIXO | obrigatório positivo | null |
| A_PARTIR_DE | obrigatório positivo | null |
| INTERVALO | obrigatório positivo | obrigatório >= mínimo |
| POR_HORA | obrigatório positivo | null |
| SOB_CONSULTA | null | null |

FIXO é uma possibilidade adicional útil compatível com a entrevista; os quatro formatos explicitamente pedidos permanecem. Não gravar strings “R$ 1.500” no banco. Tipo INTERVALO com valores iguais é permitido, exibido como valor único sem alterar tipo persistido.

| Modelo prazo | dias mínimo | dias máximo |
|---|---|---|
| FIXO | obrigatório | null |
| A_PARTIR_DE | obrigatório | null |
| INTERVALO | obrigatório | obrigatório >= mínimo |
| A_COMBINAR | null | null |

Troca de modelo limpa valores incompatíveis no formulário e servidor rejeita payload incoerente. Uma oferta ativa não excluída por prestador/tipo (unique parcial); concorrência gera erro amigável. Não aceitar categorias de tipos inativos em publicação. Pausar preserva oferta; excluir define deleted_at e ativo=false. Dono pode listar pausadas; excluídas não são restauradas pela UI V1.

## S04 Busca (RF01, RF07)
GET /buscar com q, categoria, tipo, pessoa, experiencia_min, nota_min, modelo_preco, preco_min, preco_max, prazo_ate, ordenar, pagina. Tudo validado em servidor; limites e enums inválidos voltam a valores seguros/erro de filtro claro. q até 120 chars; pagina 1–1.000 e 12 prestadores por página. Query string preserva filtros e reset de pagina quando filtros mudam.

Texto case-insensitive/accent-insensitive em nome do perfil, título/descrição da oferta, nome do tipo e categoria. Usar unaccent em migration + SQL parametrizado/escape de curingas, ou alternativa documentada testada. Apenas perfis ativos com ofertas ativas não excluídas em tipos/categorias ativos.

Aplique condições sobre a MESMA oferta: preço/prazo/tipo não podem ser satisfeitos por anúncios diferentes de um mesmo prestador. Agrupe resultados por prestador. Oferta representativa: a que passou filtros, escolhida por título + ID quando houver empate. Permita ver outras ofertas no perfil.

Filtros financeiros exigem modelo_preco explícito, exceto SOB_CONSULTA que desabilita valores. FIXO/POR_HORA: mínimo dentro do intervalo pedido; A_PARTIR_DE: preço anunciado mínimo dentro do intervalo (não promessa de custo final); INTERVALO: sobreposição das faixas. Não misturar R$/hora com R$/projeto. Ordenação por preço requer modelo numérico único; ordenar por preco_minimo, nome, ID. Sob consulta não possui ordenação numérica. Ordenação padrão nome; por nota média desc, quantidade desc, nome, ID (sem nota por último); por experiência desc, nome, ID. Contagens e agregados sem duplicação por joins.

prazo_ate: considerar FIXO por mínimo e INTERVALO por máximo <= limite; A_PARTIR_DE/A_COMBINAR são excluídos, pois não garantem limite superior. UI explica filtro como “Prazo estimado de até X dias”. Nota mínima exclui sem avaliações. Falta de resultados mostra remover filtros.

## S05 Comparação (RF08)
Selecionar 2–3 prestadores distintos, guardando oferta contextual por prestador. Até 3, mensagem no quarto. Persistir apenas IDs em localStorage (sem contato/sessão) e reidratar dados pelo servidor em /comparar?ofertas=id,id. URL compartilhável até três IDs válidos; sem login. Remover inativos/excluídos com aviso, prevenir repetição do mesmo prestador. Uma seleção permite página com orientação para adicionar outro; zero mostra estado vazio. Mudança de oferta do mesmo prestador substitui o contexto. Preços incompatíveis aparecem lado a lado com suas unidades sem indicação enganosa de “mais barato”.

## S06 Avaliações (RF10)
Qualquer usuário autenticado pode avaliar um perfil ativo de terceiros, inclusive se também presta serviços. Uma avaliação por par usuario/prestador. Nota inteira 1–5, comentário opcional 0–2.000 plain text. Nome do autor público; e-mail privado nunca. Avatar público do autor não é necessário. Criar/editar/excluir próprias; SQL UNIQUE e check de nota; self-review impedida por trigger e servidor. Edição conserva created_at, altera updated_at. Excluir remove a linha na V1. Média e contagem derivadas; média formatada em uma casa, contagem real. Sem avaliação mostrar “Sem avaliações”.

Avaliações listadas com paginação 10, recentes primeiro, ID para desempate. Mostrar texto “Avaliações de usuários da plataforma; contratação não verificada.” Não adicionar badges cliente verificado. Autorização independe de ID recebido.

## S07 Média de preços (RF11)
Não calcular média de contatos, transações ou preços finais. Para um tipo específico, apenas ofertas FIXO ativas de perfis/catálogo ativos e não excluídas; ao menos 3 prestadores distintos. Como há uma oferta ativa por par, cada prestador contribui uma vez. AVG(numeric), arredondar para duas casas na apresentação, incluir n e texto “Média dos preços fixos anunciados; não é orçamento”.

Exemplo de aceite: FIXO 800, 1000 e 1200 de três prestadores → R$ 1.000,00, n=3. Ofertas por hora, intervalos, a partir de e sob consulta ficam fora. Com n=2 mostrar “Dados insuficientes para calcular uma média”. Filtrar busca por outras condições não muda o indicador global do tipo; rotular “Neste tipo de serviço”. Sem tipo selecionado, não apresentar média combinada de serviços diferentes. Não exibir mediana/faixa típica como se estivesse implementada; é evolução.

## S08 Rotas e estados
| Rota | Acesso | Conteúdo |
|---|---|---|
| / | Público | Busca principal/catálogo |
| /buscar | Público | Filtros e resultados |
| /prestadores/[slug] | Público | Perfil/ofertas/avaliações/contatos |
| /comparar | Público | Comparação |
| /entrar e /cadastro | Público | Auth |
| /painel | Autenticado | Próxima ação e links reais, sem métricas falsas |
| /painel/perfil | Autenticado | Criar/editar perfil |
| /painel/ofertas | Dono com perfil | Lista e estados |
| /painel/ofertas/nova | Dono com perfil | Criar |
| /painel/ofertas/[id]/editar | Dono | Editar |
| /painel/conta | Autenticado | Nome/senha |

Oferta sem perfil leva a criar perfil com orientação. 404 real para perfis invisíveis. loading.tsx/error.tsx/not-found conforme apropriado. Ações devem exibir pendência e impedir duplo clique; servidor continua garantindo concorrência.

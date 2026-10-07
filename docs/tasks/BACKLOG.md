# Backlog — tracker local

Status atualizado em 06/10/2026. Evidências detalhadas em ../VALIDATION.md; limitações operacionais no README. Nenhuma issue remota criada.

| Tarefa | Depende de | Fatia / entrega | Evidência obrigatória |
|---|---|---|---|
| T00 | — | Inspecionar repo, fixar versões, scripts, Compose, env, migrations auth/domínio e seed catálogo; shell visual e tokens. | Banco saudável; migration em vazio; seed repetido; build do shell. |
| T01 | T00 | Cadastro/login/logout, conta privada e autorização base. | Sessão persiste; logout revoga; mutation sem sessão falha; senha não vaza. |
| T02 | T01 | Criar/editar/desativar perfil e renderizar URL pública com contatos. | Usuários A/B não editam um ao outro; perfil desativado vira 404. |
| T03 | T02 | CRUD e pausa/exclusão lógica de ofertas, formatos condicionais de preço/prazo. | Dados persistem; constraints inválidas falham; concorrência UNIQUE parcial. |
| T04 | T03 | Home/catálogo e busca real agrupada, filtros, paginação e ordenação. | Filtros na mesma oferta; acentos; hora vs projeto; zero resultados. |
| T05 | T04 | Comparação de até três resultados com estado local e URL. | Quarto recusado; mesmo prestador não duplica; anúncio pausado some com aviso. |
| T06 | T02 | Criar/editar/excluir avaliação e agregados públicos. | UNIQUE par e self-review em app/banco; edição/exclusão recalculam média. |
| T07 | T04 | Preço médio fixo por tipo com amostra e rótulo transparente. | 800/1000/1200 → 1000; outros modelos excluídos; n<3 não exibe número. |
| T08 | T05,T06,T07 | Seed demo opcional, estados completos, acessibilidade e polimento de todas as jornadas. | QA 375/768/1440; teclado; dados vazios/longos; sem placeholder morto. |
| T09 | T08 | Revisão de acesso/segurança, testes integrados e E2E, README operacional. | Todos os gates do ACCEPTANCE com resultados registrados. |
| T10 | T09 | Entrega final, arquivos/decisões atualizados, guia de execução e limitações. | Fresh install documentado; restart preserva dados; matriz RF completa. |

## Estratégia de execução
T00 é base técnica necessária; T01–T07 são fatias verticais, não agentes separados construindo frontend e backend sem contrato. Delegação opcional pode paralelizar T05/T06/T07 após suas dependências. Um integrador controla migrations, auth e tokens. Não editar mesmas migrations em paralelo. Cada tarefa referencia RF no PRD/Sxx na spec e acrescenta testes apenas relevantes.

## Registro a preencher pelo implementador
| Tarefa | Status | Arquivos / RF / evidência |
|---|---|---|
| T00 | DONE | package.json, compose.yaml, src/lib/db, drizzle, scripts; RF12; banco saudável, migration vazia, seed duas vezes e build passaram |
| T01 | DONE | src/lib/auth, actions/auth, entrar/cadastro/painel/conta; RF02; sessão real, logout, alteração de senha e revogação em E2E |
| T02 | DONE | actions/provider, painel/perfil, prestadores; RF03/04; propriedade, ativação e HTTP404 verificadas |
| T03 | DONE | actions/offers, painel/ofertas, schema; RF05/06; CRUD E2E, checks e concorrência SQL passaram |
| T04 | DONE | lib/public/queries, buscar, home; RF01/07; filtros mesma oferta, acentos e ordenação testados |
| T05 | DONE | comparar, comparison-selection; RF08; limite três, troca de contexto, pausa e persistência em E2E |
| T06 | DONE | actions/reviews, profile-reviews, queries; RF09/10; edição/exclusão, agregados, UNIQUE e self-review testados |
| T07 | DONE | public queries/formatters; RF11; média FIXO e n mínimo testados |
| T08 | DONE | seed-demo, UI/CSS, visual-qa; 40 capturas por rodada, zero overflow; revisão independente e correções |
| T09 | DONE | tests, README, VALIDATION; 28 unitários, 9 integração, 8 E2E; lint/typecheck/build passaram |
| T10 | DONE | README, ADR0002, DESIGN, VALIDATION; instalação congelada e restart passaram; matriz RF01–12 registrada |

Limite conhecido: audit de runtime limpo; ferramenta de desenvolvimento traz um advisory alto transitivo sem correção disponível. Não há deploy em nuvem; decisões de operação pública permanecem fora do escopo. Próxima etapa opcional é preparar um ambiente de hospedagem com suas políticas reais.

# Validação da entrega

Execução local em 06/10/2026, Windows, Node 24, PostgreSQL 17.6 em Docker. Sem publicação em nuvem. Comandos de execução no README.

| Gate | Resultado |
|---|---|
| Instalação com lockfile congelado | Passou |
| lint / typecheck | Passaram |
| test | 28 testes passaram |
| test:integration | 9 testes passaram em PostgreSQL dedicado |
| build | Produção compilou todas as rotas |
| test:e2e | 8 testes passaram com Chromium e servidor de produção |
| Migrations em banco vazio e seed repetido | Passaram; catálogo sem duplicação |
| db:generate após migrations | Sem diferença de schema |
| Reiniciar aplicativo e container | Sessão válida e contagens de usuários/perfis/ofertas/avaliações preservadas |
| audit --prod | Nenhuma vulnerabilidade conhecida |

Integração verifica checks, concorrência no índice parcial, responsável imutável, timestamps, autoavaliação, busca sem acentos, filtros na mesma oferta, média elegível e comparação. E2E verifica cadastro, login/logout, alteração de nome/senha com revogação das outras sessões, perfil e ofertas, isolamento entre contas, desativação/404, busca, comparação persistente, avaliações, filtro mobile e foto indisponível. Testes usam DATABASE_URL_TEST; o banco de desenvolvimento permanece independente.

## Matriz funcional

| Requisito | Implementação e evidência |
|---|---|
| RF01 | Home e busca públicas; E2E busca e estado vazio |
| RF02 | Better Auth, conta, logout e rotação de senha; E2E privado e unitário de sessão |
| RF03 | Perfil PF/PJ vinculado à conta; criação no E2E, validações unitárias |
| RF04 | Edição/ativação/contatos; E2E propriedade e 404 após desativação |
| RF05 | CRUD, pausa e exclusão lógica; E2E e concorrência SQL |
| RF06 | Catálogo e preço/prazo condicionais; Zod, formatadores e checks SQL |
| RF07 | Consulta agrupada, filtros, ordem e paginação; integração e E2E |
| RF08 | Até três prestadores, estado local e revalidação; E2E comparação |
| RF09 | Perfil, contatos, ofertas e reputação; E2E email privado protegido |
| RF10 | Criar/editar/excluir avaliação; E2E e bloqueio de autoavaliação em action/SQL |
| RF11 | Média de preço FIXO com pelo menos três prestadores; integração e E2E |
| RF12 | PostgreSQL, sessão e autorização no servidor; integração, E2E e restart |

## Revisão visual

40 capturas por rodada em 375/768/1440px: home, busca, busca filtrada, perfis, comparação, autenticação, painel e formulários. Relatório local em artifacts/visual-qa/report.json, sem overflow de página ou status de erro. Imagens e sessões de teste são ignoradas pelo Git.

A revisão independente encontrou a barra de comparação cobrindo campos privados e rótulos decorativos acima dos títulos. Correções: barra restrita à busca/perfis, seleção preservada; remoção dos rótulos decorativos. A segunda rodada confirma esses itens. O modal mobile usa Radix; testes verificam abertura, Escape e ausência de overflow. Capturas não equivalem a uma auditoria completa com leitor de tela.

## Limites

A auditoria completa de ferramentas também encontrou um alerta alto em braces, transitivo de eslint-config-next/fast-glob/micromatch, sem versão corrigida indicada pelo audit (GHSA-vfj7-8cjw-p6xm). Não está nas dependências de runtime. Reavaliar quando o fornecedor disponibilizar correção.

Este aceite cobre o MVP local. SMTP, recuperação/verificação de email, moderação, operação pública, backup/restore do ambiente de hospedagem e implantação não integram a entrega. Não há alegação de avaliações ou contratações verificadas. Dados demo são opcionais e claramente identificados.

# Backlog — tracker local

Status inicial de todas as tarefas: TODO. Ao executar, atualizar para IN_PROGRESS/DONE/BLOCKED, com evidência e pendências. Não abrir issues remotas automaticamente.

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
Para cada tarefa: status, arquivos alterados, RF/Sxx atendidos, comandos e resultado, riscos/bloqueios, próxima tarefa. Retomada de sessão lê esse registro antes de inventar novo plano.

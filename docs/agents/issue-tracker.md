# Issue tracker: Markdown local

Specs e issues deste repositório vivem como arquivos markdown versionados em `docs/tasks/`. Nenhuma issue remota é criada sem instrução do dono.

`docs/tasks/BACKLOG.md` é o registro histórico do MVP 1 (T00–T10) e não recebe novas tarefas.

## Convenções

- Uma feature (ou entrega) por diretório: `docs/tasks/<feature-slug>/`
- A spec fica em `docs/tasks/<feature-slug>/spec.md`
- Issues de implementação: um arquivo por ticket em `docs/tasks/<feature-slug>/issues/<NN>-<slug>.md`, numerados a partir de `01`; nunca um arquivo único com todos os tickets
- Estado de triagem: linha `Status:` perto do topo de cada issue (valores em `triage-labels.md`)
- Comentários e histórico são anexados ao fim do arquivo, sob `## Comentários`
- Ao concluir, a issue registra evidência de aceite (testes, comandos, capturas), não só o status

## Quando uma skill disser "publicar no issue tracker"

Criar um arquivo novo em `docs/tasks/<feature-slug>/` (criando o diretório se preciso).

## Quando uma skill disser "buscar o ticket"

Ler o arquivo no caminho referenciado. Normalmente o caminho ou o número é passado diretamente.

## Operações de wayfinding

Usadas por `/wayfinder`. O **mapa** é um arquivo com um **filho** por ticket.

- **Mapa**: `docs/tasks/<esforço>/map.md` (corpo Notes / Decisions-so-far / Fog).
- **Ticket filho**: `docs/tasks/<esforço>/issues/NN-<slug>.md`, numerado a partir de `01`, com a pergunta no corpo. Linha `Type:` (`research`/`prototype`/`grilling`/`task`); linha `Status:` (`claimed`/`resolved`).
- **Bloqueio**: linha `Blocked by: NN, NN` perto do topo. Desbloqueado quando todos os listados estão `resolved`.
- **Fronteira**: varrer `docs/tasks/<esforço>/issues/` por arquivos abertos, desbloqueados e não reivindicados; vence o menor número.
- **Reivindicar**: definir `Status: claimed` e salvar antes de qualquer trabalho.
- **Resolver**: anexar a resposta sob `## Answer`, definir `Status: resolved` e acrescentar um ponteiro (resumo + link) em Decisions-so-far do `map.md`.

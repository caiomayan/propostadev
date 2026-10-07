# Instrução para o agente implementador

Você é responsável por implementar TODO o MVP Proposta.dev neste repositório. Trabalhe até existir um sistema executável e verificado, seguindo SDD e os documentos fornecidos. Este pacote foi aprovado como direção de produto; não comece outra entrevista completa.

Leia README.md, AGENTS.md, GLOSSARY.md, docs/PRD.md, docs/SCOPE.md, docs/ARCHITECTURE.md, docs/DESIGN-SYSTEM.md, docs/schema.dbml, docs/specs/MVP.md, docs/tasks/BACKLOG.md e docs/ACCEPTANCE.md antes de editar código.

Comece inspecionando o repositório e as instruções existentes. Preserve arquivos e trabalho anteriores. Se vazio, inicialize Next.js App Router com TypeScript strict, Tailwind e shadcn/ui. Use PostgreSQL em Docker Compose, Drizzle, Better Auth, Zod, Vitest e Playwright. Verifique versões estáveis e compatibilidade nas documentações oficiais e registre o conjunto escolhido. Nunca instale PostgreSQL no host.

Execute T00 a T10 do backlog respeitando dependências. Cada fatia deve integrar tela, validação, autorização, banco e testes pertinentes. Crie migrations SQL, seeds idempotentes, env de exemplo e README operacional. Não use arrays estáticos como substituto do banco nem autenticação simulada. Dados fictícios pertencem apenas ao seed de demonstração e devem ser identificados como tal.

Se as skills de Matt Pocock estiverem instaladas, leia as relevantes. Use configuração com tracker local, PRD fornecido e tarefas em docs/tasks; não publique issues automaticamente. Não invente que executou skills inexistentes. Se faltarem, siga os documentos e continue. Use grill-me/grill-with-docs apenas diante de contradição material não resolvida. Decisões reversíveis podem ser tomadas e registradas em ADR.

O design deve ser neutro e sóbrio, com shadcn/ui personalizado conforme tokens e composições especificados. Evite o visual genérico de landing page gerada por IA. O foco é a busca e o diretório de prestadores. Não implemente funcionalidades fora do escopo.

Você pode delegar subtarefas a agentes se seu ambiente permitir; mantenha um responsável pela integração e atribua propriedade de arquivos para evitar conflitos. A delegação é opcional. Não deixe cada agente inventar schemas ou design systems próprios.

Ao final, execute lint, typecheck, testes unitários/integração/E2E e build. Inspecione visualmente mobile e desktop. Informe os comandos executados, resultados, limitações reais e como rodar. Não declare sucesso de um teste que não rodou. Se um serviço externo impedir uma parte, conclua o restante e documente o bloqueio específico. Não faça deploy, pagamentos ou publicação externa nesta tarefa.

Comece agora pela inspeção e T00; prossiga até o MVP completo.

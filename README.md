# Proposta.dev — pacote de implementação MVP

Versão 1.0 • 06/10/2026 • Português brasileiro

Este é um pacote de requisitos e execução, não um aplicativo já implementado. Extraia na raiz do repositório e envie ao agente o conteúdo de `PROMPT-AGENTE.md`. A primeira atividade é conferir o ambiente; a entrega esperada é o sistema funcionando com banco real, não apenas telas.

## Ordem de leitura
1. AGENTS.md e GLOSSARY.md.
2. docs/PRD.md e docs/SCOPE.md.
3. docs/ARCHITECTURE.md e docs/DESIGN-SYSTEM.md.
4. docs/schema.dbml e docs/specs/MVP.md.
5. docs/tasks/BACKLOG.md e docs/ACCEPTANCE.md.

## Decisões já tomadas
- Next.js App Router, TypeScript strict, Tailwind, shadcn/ui; monólito modular.
- PostgreSQL em Docker Compose, Drizzle ORM + migrations SQL versionadas, Better Auth com e-mail/senha e sessões persistidas.
- App executa localmente com Node; apenas o banco precisa de Docker. Sem Supabase, Redis ou backend separado.
- Usuário único; perfil de prestador opcional, PF ou PJ. Sem CPF/CNPJ na V1.
- Catálogo administrado por seed; ofertas próprias dos prestadores; descoberta, comparação e contato externo.
- Avaliações abertas a usuários autenticados, uma por usuário/prestador, sem autoavaliação.
- Sem contratação, propostas, pagamentos, demandas, triagem ou recomendação automática.

## Skills de Matt Pocock
Instale no seu repositório com `npx skills@latest add mattpocock/skills`, escolhendo o agente de destino. O repositório oficial recomenda incluir `setup-matt-pocock-skills` e executar o setup por repositório. Configure documentos em `docs/`, glossário em `GLOSSARY.md` e tracker local em `docs/tasks/`.

Os nomes das skills mudam entre versões: confira a instalação. O fluxo atual consultado é entrevista (`grill-me`/`grill-with-docs`), síntese de PRD (`to-prd`) e decomposição (`to-issues`); versões anteriores usavam `write-a-prd` e `prd-to-issues`. O pacote já contém o resultado desses passos. Use a entrevista apenas para bloqueios novos; não refaça todas as perguntas e não recrie o PRD sem motivo. Skills complementam SDD; não substituem specs e testes. Não há skills instaladas dentro deste ZIP.

## Como entregar ao agente
Cole PROMPT-AGENTE.md e permita leitura desta pasta. Ele deve implementar uma fatia funcional por vez, atualizar o backlog, testar, revisar e continuar até concluir o MVP. Não é preciso uma aprovação entre cada tarefa. Publicação, domínio e serviços pagos ficam fora desta entrega.

Fontes técnicas consultadas: docs/SOURCES.md. Escolhas de produto são decisões deste projeto, não regras prescritas por essas fontes.

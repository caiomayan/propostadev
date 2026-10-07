# Regras do projeto Proposta.dev

## Autoridade e execução
Requisitos explícitos do usuário prevalecem. Para este pacote: SCOPE/PRD definem produto; specs definem comportamento; schema define persistência; design system define apresentação; backlog define execução. Divergências entre documentos devem ser resolvidas antes de implementar o comportamento afetado e registradas em ADR. O .mwb e o board originais são históricos e não prevalecem sobre este pacote.

Não solicite aprovação para escolhas reversíveis já abrangidas. Não acrescente funcionalidades por iniciativa própria. Preserve instruções anteriores do repositório e reporte conflitos. Use docs/tasks/BACKLOG.md como tracker local. Atualize status e evidência, não apenas marque tarefas como prontas.

## Código
- TypeScript strict, sem any para ocultar erro; nomes de domínio conforme GLOSSARY.
- Server Components por padrão; Client Components somente para interação.
- Banco, secrets, auth e autorização em módulos server-only.
- Toda mutação valida entrada e sessão e verifica proprietário no servidor.
- Nunca confie em usuario_id/prestador_id enviados pelo cliente para autorização.
- SQL parametrizado. Dinheiro decimal como string/decimal, sem aritmética financeira em float.
- Sem arquiteturas de microserviços, repository genérico, event bus ou abstrações especulativas.
- Componentes de UI reutilizáveis quando houver uso real; não copiar páginas inteiras.
- Segredos fora do git. .env.example apenas com placeholders ou credenciais locais descartáveis.
- Migrations incrementais versionadas; não usar push destrutivo como fluxo normal.
- Schema de auth é gerado pela versão do Better Auth; não reinventar suas tabelas.
- Tests verificam comportamento observável, constraints e acesso indevido; sem snapshots maciços.

## Conclusão
Cada tarefa tem evidência de aceite; se teste bloquear, registrar causa e continuar no independente. Não marcar implementação parcial como concluída. Atualizar README, progresso e decisões ao retomar sessões. Não criar commits, issues ou deploy externos sem instrução do usuário para isso. Nenhum coautor de IA deve ser acrescentado a commits.

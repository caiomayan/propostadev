# Limites e decisões aprovadas

A entrevista mais recente substitui o desenho original do MySQL Workbench e os requisitos mais amplos do board. O histórico falava em cliente/prestador exclusivos, triagem, demandas, propostas e taxas. Nada disso deve ser recuperado automaticamente.

## Decisões preenchidas para permitir execução
- Primeira versão concentrada em desenvolvimento web: Web, Backend e APIs, Manutenção e Integrações. Mobile/Desktop ficam para expansão do seed.
- PF/PJ descreve o perfil, sem documentos nem validação jurídica. Não usar freelancer na UI.
- Um perfil por usuário; PJ pode usar nome comercial; sem contas de equipe.
- UUID para perfil/oferta/catálogo/avaliação; usuário usa o ID nativo textual da biblioteca de auth.
- Experiência registrada como anos inteiros autodeclarados, editáveis; não aumentada automaticamente.
- Localização opcional: cidade/UF/país, sem endereço completo. Serviços podem ser remotos.
- Foto por URL HTTPS, opcional; sem upload ou fetch de imagem no backend.
- E-mail público obrigatório para perfil ativo; telefone/WhatsApp opcionais.
- Uma oferta ativa por prestador/tipo de serviço; pode editar ou criar outra após pausar a anterior.
- Faixas devem respeitar máximo >= mínimo; sem limite percentual arbitrário de amplitude na V1.
- Prazo em dias corridos estimados; não garantia de entrega. Por hora não exige prazo fixo.
- Comparação até três prestadores distintos, persistida localmente, sem conta/favoritos.
- Avaliação nota inteira 1–5, comentário opcional até 2.000 caracteres; uma por usuário/prestador.
- Ordenação padrão alfabética por nome do perfil + ID; sem ranking de relevância opaco.
- Conta não tem endpoint de exclusão automatizada nesta V1; não publicar políticas fictícias ou prometer processos inexistentes.

Mudanças em must-have ou regras financeiras precisam atualizar PRD, spec, migration/DBML, testes e ADR. Melhorias visuais compatíveis com os tokens não exigem reabrir produto.

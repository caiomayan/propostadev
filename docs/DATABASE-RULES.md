# Regras de persistência que complementam o DBML

DBML é documento do domínio; migrations executáveis são obrigatórias. Não considerar default now() como atualização automática de updated_at.

1. Auth gerada pela biblioteca, incluindo PK e sessão/account/verification. FK usuario_id de domínio aponta ao user.id físico correto. Uma conta tem zero ou um perfil; UNIQUE usuario_id.
2. Trigger SQL updated_at em UPDATE nas tabelas de domínio, evitando divergência entre actions e scripts; auth respeita comportamento próprio da biblioteca.
3. UNIQUE parcial oferta (prestador_id, tipo_servico_id) WHERE ativo=true AND deleted_at IS NULL. Sem UNIQUE geral do par: ofertas pausadas anteriores podem coexistir. CHECK deleted_at IS NULL OR ativo=false.
4. Anos experiência BETWEEN 0 AND 80; descrições perfil/oferta entre 30 e 5.000 caracteres; nomes/títulos conforme spec; textos obrigatórios trim não vazio.
5. Preço CHECK com ramificações completas: SOB_CONSULTA exige ambos NULL; FIXO/A_PARTIR_DE/POR_HORA exigem min > 0 e max IS NULL; INTERVALO exige ambos não nulos, min > 0, max >= min. Escrever IS NOT NULL explícito para não deixar CHECK retornar UNKNOWN e aceitar payload inválido. Limite numérico garantido por numeric(10,2).
6. Prazo CHECK completo: A_COMBINAR exige ambos NULL; FIXO/A_PARTIR_DE exigem min não NULL BETWEEN 1 AND 3650 e max NULL; INTERVALO exige ambos não NULL e 1 <= min <= max <= 3650.
7. Avaliação: CHECK nota 1–5, UNIQUE par, limite comentário. Trigger BEFORE INSERT OR UPDATE consulta dono de prestador e recusa usuario_id igual ao dono. Dono do perfil não pode ser transferido na V1 (sem endpoint, mais trigger para bloquear mudança em usuario_id), impedindo self-review por transferência. Aplicação também verifica para mensagem amigável.
8. Integridade de ativação: aplicação valida catálogo/perfil antes de publicar; leitura pública sempre aplica estado de todas as entidades. Desativação do perfil não altera ativo individual das ofertas; reativação restaura visibilidade.
9. FK com cascades na exclusão física excepcional de usuário/perfil; catálogo com RESTRICT. A UI apenas desativa perfil/exclui logicamente oferta; não expõe deleção física de conta.
10. Índices por FKs e avaliações prestador/data; unique slug. unaccent via CREATE EXTENSION IF NOT EXISTS unaccent e pesquisa com limites. Otimizações trigram/FTS são opcionais se medição justificar, não requisito para MVP pequeno.

## Verificação mínima por SQL/integration
Inserções diretas inválidas (nota 6, preço nulo no FIXO, intervalo invertido, prazo inválido, self-review) falham. Duas publicações simultâneas do mesmo par resultam em uma ativa. Atualizar descrição altera updated_at sem mexer em created_at. Não duplica nota/preço médio ao juntar ofertas e reviews. Banco novo migra e seed repetido não duplica catálogo.

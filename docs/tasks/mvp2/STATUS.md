# MVP 2 — estado na pausa (01/11/2026, noite)

Pausa pedida pelo dono. Os workers pararam ao atingir o limite de uso da conta. Todo trabalho está commitado e publicado no GitHub.

## Integrado em `mvp2` (verde: lint, typecheck, unit 59, integração 35, build, E2E 21)
- 01 Base em produção — **done**. Produção na main com Next 16.4.3 e DATABASE_URL corrigido.
- 02 Identidade visual — **done**.
- 03 Tipo de conta — **done**.
- 04 Triagem e Projeto — **done**. Pendência pequena: espaços faltando em textos como "3prestadores" e "1ano de experiência", que o worker do 05 não conseguiu reproduzir.
- 08 Autenticação enriquecida + `?next` no cadastro — **done**. OAuth e SMTP reais só serão testados quando houver credenciais.

## Em branch, ainda NÃO integrado
- **05 Oportunidades/Propostas/Convites**: branch `caiomayan/mvp2-04-triagem` (e77ec8f), migration 0004. O worker relata lint, typecheck, unit 59, integração 46 e E2E 18 verdes.
  - Falta: verificação no browser em 375 e 1440; merge em mvp2; bateria completa no integrado.
- **09 parte A, acabamento visual**: branch `caiomayan/mvp2-08-auth` (29edd0f). Menu mobile, painel do Prestador, perfil, comparar, 404/erro/loading.
  - Falta: corrigir 2 E2E.
  - `private.spec.ts:49`: a edição de oferta de outra conta retorna 200 em vez de 404. A query ainda filtra pelo dono e chama notFound(), então não há vazamento. Provável causa: algum loading.tsx novo fez o 404 virar resposta streaming 200 (mesmo problema registrado no ADR 0002).
  - `public.spec.ts:168`: iniciais do avatar quando a foto está indisponível.
  - Também falta conferir o modo claro e fechar o checklist.

## Próximos tickets
06 Triagem de Propostas e Aceite → 07 Avaliações verificadas → 09 parte B (seed demo com Propostas + telas novas) → 10 Entrega final.

## Como retomar
1. Integrar o 05: merge de `caiomayan/mvp2-04-triagem`, verificar no browser e rodar a bateria completa.
2. Corrigir as 2 falhas do 09A e integrar.
3. Despachar o 06, depois o 07, o 09B e o 10.

Workers do Orca: lançar com o contorno do aviso de bypass registrado na memória do coordenador. Banco local: `docker compose up -d`.

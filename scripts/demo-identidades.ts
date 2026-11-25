// Identidade pública dos 20 Prestadores demo (ADR 0005, decisão 1): nome de pessoa (PF) ou de empresa (PJ), slug no mesmo
// formato do cadastro real (nome + 8 caracteres) e contato em domínio reservado `.example`, que nunca entrega mensagem.
// O login continua `prestadorN@demo.example`. Fonte única: seed-demo, demo-scenarios e o módulo que renomeia a produção.

type Identity = { name: string; suffix: string; contact: string; about?: string };

const identities: Record<number, Identity> = {
  1: { name: "Aurora Web Studio", suffix: "3f9a1c2e", contact: "contato@aurorawebstudio.example" },
  2: { name: "Bruno Cavalcanti", suffix: "8d2e47b1", contact: "bruno@brunocavalcanti.example", about: "Faço páginas de lançamento: estrutura de oferta, prova social e carregamento rápido no celular." },
  3: { name: "Nexo Studio", suffix: "c41f0a93", contact: "ola@nexostudio.example" },
  4: { name: "Clara Medeiros", suffix: "5b7e2d10", contact: "clara@claramedeiros.example" },
  5: { name: "Ponte Digital", suffix: "e2a9c654", contact: "comercial@pontedigital.example" },
  6: { name: "Henrique Batista", suffix: "91c3b8f7", contact: "henrique@henriquebatista.example" },
  7: { name: "Maré Sistemas", suffix: "0f6d3e29", contact: "contato@maresistemas.example" },
  8: { name: "Diego Albuquerque", suffix: "a7b25e0c", contact: "diego@diegoalbuquerque.example" },
  9: { name: "Vértice Commerce", suffix: "46e1f9d3", contact: "contato@verticecommerce.example" },
  10: { name: "Renata Farias", suffix: "d93a07c5", contact: "renata@renatafarias.example" },
  11: { name: "Carrinho Certo", suffix: "7c58e1a0", contact: "atendimento@carrinhocerto.example" },
  12: { name: "Sistema Ágil", suffix: "2e04b6f8", contact: "contato@sistemaagil.example" },
  13: { name: "Gabriel Tavares", suffix: "b1f97c42", contact: "gabriel@gabrieltavares.example" },
  14: { name: "Base Sólida Software", suffix: "f5a3d81e", contact: "projetos@basesolida.example" },
  15: { name: "André Moraes", suffix: "63d0e2b9", contact: "andre@andremoraes.example" },
  16: { name: "Rota Integrações", suffix: "9a7c14e6", contact: "contato@rotaintegracoes.example" },
  17: { name: "Patrícia Lins", suffix: "c8e65f03", contact: "patricia@patricialins.example" },
  18: { name: "Beatriz Nunes", suffix: "1d4b9a7e", contact: "beatriz@beatriznunes.example" },
  19: { name: "Atalaia Digital", suffix: "e70f2c5d", contact: "contato@atalaiadigital.example" },
  20: { name: "Felipe Araújo", suffix: "58b3a1f4", contact: "felipe@felipearaujo.example" },
};

const slugify = (name: string) => name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function demoIdentity(n: number) {
  const identity = identities[n];
  if (!identity) throw new Error(`Prestador demo sem identidade: ${n}`);
  return { ...identity, slug: `${slugify(identity.name)}-${identity.suffix}`, loginEmail: `prestador${n}@demo.example` };
}

export const demoIdentityNumbers = Object.keys(identities).map(Number);

/** Slug público do Prestador demo N (as listas de cenários usam o número, não o slug). */
export const demoSlug = (n: number) => demoIdentity(n).slug;

/** Avaliação anterior, sem contratação verificada (cliente1 → Prestador demo 1): trabalho combinado fora da plataforma. */
export const LEGACY_REVIEW = "Fez o site da nossa loja em 2024, antes de existir a plataforma. Atendimento bom e entrega no combinado.";
export const OLD_LEGACY_REVIEW = "Bom atendimento em um trabalho feito antes de a contratação pela plataforma existir.";

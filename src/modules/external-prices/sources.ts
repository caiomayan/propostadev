// Fontes públicas de preço, versionadas no código (ADR 0004, decisão 1; pesquisa de 24/11/2026).
// Só páginas de "quanto custa" em reais, sem login nem JavaScript. api, backend e integracao-de-sistemas ficam sem fonte.
export type PriceSource = { serviceSlug: string; name: string; url: string; serviceDescription: string };

export const priceSources: readonly PriceSource[] = [
  { serviceSlug: "landing-page", name: "Cronoshare", url: "https://www.cronoshare.com.br/quanto-custa/criar-site", serviceDescription: "criação de uma landing page (página única de vendas ou captação)" },
  { serviceSlug: "site-institucional", name: "Cronoshare", url: "https://www.cronoshare.com.br/quanto-custa/criar-site", serviceDescription: "criação de um site institucional completo (vários blocos ou páginas)" },
  { serviceSlug: "site-institucional", name: "Hostinger", url: "https://www.hostinger.com/br/tutoriais/quanto-custa-fazer-um-site/", serviceDescription: "criação de um site institucional ou corporativo" },
  { serviceSlug: "site-institucional", name: "Nuvemshop", url: "https://www.nuvemshop.com.br/blog/quanto-custa-um-site/", serviceDescription: "criação de um site institucional" },
  { serviceSlug: "e-commerce", name: "Hostinger", url: "https://www.hostinger.com/br/tutoriais/quanto-custa-fazer-um-site/", serviceDescription: "criação de uma loja virtual (e-commerce)" },
  { serviceSlug: "sistema-web", name: "Sebrae PR", url: "https://sebraepr.com.br/comunidade/artigo/software-house-fatores-que-influenciam-no-orcamento-de-um-software-sob-medida", serviceDescription: "desenvolvimento de um sistema web ou software sob medida" },
  { serviceSlug: "sistema-web", name: "Hostinger", url: "https://www.hostinger.com/pt/tutoriais/?p=48824", serviceDescription: "desenvolvimento de um sistema web ou aplicativo sob medida" },
  { serviceSlug: "manutencao-web", name: "Hostinger", url: "https://www.hostinger.com/br/tutoriais/quanto-custa-manter-um-site", serviceDescription: "manutenção mensal de um site" },
];

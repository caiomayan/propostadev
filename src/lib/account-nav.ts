import type { AccountType } from "@/lib/auth/user-fields";

export type PanelIcon = "home" | "profile" | "offers" | "opportunities" | "proposals" | "projects" | "triage" | "account" | "mail" | "public";
export type PanelLink = { href: string; label: string; icon: PanelIcon };
export type SiteLink = { href: string; label: string };

/** Destinos da conta. A navegação lateral e o menu do avatar leem esta lista, então não divergem. */
export function panelLinks(type: AccountType): PanelLink[] {
  const provider = type === "PRESTADOR";
  return [
    { href: "/painel", label: provider ? "Visão geral" : "Início", icon: "home" },
    ...(provider
      ? [{ href: "/painel/perfil", label: "Perfil", icon: "profile" }, { href: "/painel/ofertas", label: "Ofertas", icon: "offers" }, { href: "/painel/oportunidades", label: "Oportunidades", icon: "opportunities" }, { href: "/painel/propostas", label: "Propostas", icon: "proposals" }] as PanelLink[]
      : [{ href: "/painel/projetos", label: "Projetos", icon: "projects" }, { href: "/triagem", label: "Nova triagem", icon: "triage" }] as PanelLink[]),
    { href: "/painel/conta", label: "Conta", icon: "account" },
  ];
}

const search = { href: "/buscar", label: "Buscar desenvolvedores" };
const compare = { href: "/comparar", label: "Comparar" };

/** Cada conta só vê o que pode usar: Cliente não oferece serviços, e Prestador não publica Projetos. */
export function siteLinks(type: AccountType | null | undefined, signedIn: boolean): SiteLink[] {
  if (type === "PRESTADOR") return [{ href: "/painel/oportunidades", label: "Oportunidades" }, search, compare];
  if (type === "CLIENTE" || signedIn) return [{ href: "/triagem", label: "Triagem" }, search, compare];
  return [{ href: "/triagem", label: "Triagem" }, search, { href: "/cadastro?tipo=PRESTADOR", label: "Oferecer serviços" }, compare];
}

export function isCurrent(pathname: string, href: string) {
  const path = href.split("?")[0];
  return path === "/painel" ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
}

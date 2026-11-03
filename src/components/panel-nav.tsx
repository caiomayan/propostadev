"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, CircleUserRound, Compass, FileText, FolderKanban, House, Search, Settings2, Tag } from "lucide-react";

const icons = { home: House, profile: CircleUserRound, offers: Tag, opportunities: Compass, proposals: FileText, projects: FolderKanban, triage: Search, account: Settings2, default: BriefcaseBusiness };
export type PanelLink = { href: string; label: string; icon: keyof typeof icons };

/** Itens da navegação do painel, com a seção atual marcada. */
export function PanelLinks({ links }: { links: PanelLink[] }) {
  const pathname = usePathname();
  return <>{links.map((link) => {
    const Icon = icons[link.icon];
    const current = link.href === "/painel" ? pathname === "/painel" : pathname === link.href || pathname.startsWith(`${link.href}/`);
    return <Link key={link.href} href={link.href} aria-current={current ? "page" : undefined}><Icon aria-hidden="true"/><span>{link.label}</span></Link>;
  })}</>;
}

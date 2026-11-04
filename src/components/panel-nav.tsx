"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUserRound, Compass, ExternalLink, FileText, FolderKanban, House, Mail, Search, Settings2, Tag, type LucideIcon } from "lucide-react";
import { isCurrent, type PanelIcon, type PanelLink } from "@/lib/account-nav";

export const panelIcons: Record<PanelIcon, LucideIcon> = { home: House, profile: CircleUserRound, offers: Tag, opportunities: Compass, proposals: FileText, projects: FolderKanban, triage: Search, account: Settings2, mail: Mail, public: ExternalLink };

/** Itens da navegação do painel, com a seção atual marcada. */
export function PanelLinks({ links }: { links: PanelLink[] }) {
  const pathname = usePathname();
  return <>{links.map((link) => {
    const Icon = panelIcons[link.icon];
    return <Link key={link.href} href={link.href} aria-current={isCurrent(pathname, link.href) ? "page" : undefined}><Icon aria-hidden="true"/><span>{link.label}</span></Link>;
  })}</>;
}

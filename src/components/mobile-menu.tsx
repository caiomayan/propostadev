"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { isCurrent, type SiteLink } from "@/lib/account-nav";
import { unreadLabel } from "@/modules/avisos/links";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// Menu da navegação em telas estreitas. O Radix Dialog cuida do foco (preso dentro, devolvido ao botão),
// do Escape e do aria-expanded do botão; cada link fecha o painel ao navegar. Quem está logado usa o menu do avatar ao lado.
export function MobileMenu({ links, signedIn, unread = null }: { links: SiteLink[]; signedIn: boolean; unread?: number | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger asChild><button type="button" className="menu-button" aria-label="Menu"><Menu aria-hidden="true"/><span>Menu</span></button></SheetTrigger>
    <SheetContent side="right" className="mobile-menu">
      <SheetTitle className="mobile-menu-title">Menu</SheetTitle>
      <SheetDescription className="sr-only">Navegação principal da Proposta.dev</SheetDescription>
      <nav aria-label="Principal (menu)" className="mobile-menu-nav">
        {links.map((link) => <SheetClose asChild key={link.href}><Link href={link.href} aria-current={isCurrent(pathname, link.href) ? "page" : undefined}>{link.label}</Link></SheetClose>)}
        {unread !== null && <SheetClose asChild><Link href="/painel/avisos" className="avisos-link" aria-current={isCurrent(pathname, "/painel/avisos") ? "page" : undefined} aria-label={unreadLabel(unread)}><span aria-hidden="true">Avisos</span>{unread > 0 && <span className="avisos-link-count" aria-hidden="true">{unread > 99 ? "99+" : unread}</span>}</Link></SheetClose>}
      </nav>
      {!signedIn && <SheetClose asChild><Link href="/entrar" className="button mobile-menu-account">Entrar</Link></SheetClose>}
    </SheetContent>
  </Sheet>;
}

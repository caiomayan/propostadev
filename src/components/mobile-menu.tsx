"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type MenuLink = { href: string; label: string };

// Menu da navegação em telas estreitas. O Radix Dialog cuida do foco (preso dentro, devolvido ao botão),
// do Escape e do aria-expanded do botão; cada link fecha o painel ao navegar.
export function MobileMenu({ links, account }: { links: readonly MenuLink[]; account: MenuLink }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger asChild><button type="button" className="menu-button" aria-label="Menu"><Menu aria-hidden="true"/><span>Menu</span></button></SheetTrigger>
    <SheetContent side="right" className="mobile-menu">
      <SheetTitle className="mobile-menu-title">Menu</SheetTitle>
      <SheetDescription className="sr-only">Navegação principal da Proposta.dev</SheetDescription>
      <nav aria-label="Principal (menu)" className="mobile-menu-nav">
        {links.map((link) => <SheetClose asChild key={link.href}><Link href={link.href} aria-current={pathname === link.href ? "page" : undefined}>{link.label}</Link></SheetClose>)}
      </nav>
      <SheetClose asChild><Link href={account.href} className="button mobile-menu-account">{account.label}</Link></SheetClose>
    </SheetContent>
  </Sheet>;
}

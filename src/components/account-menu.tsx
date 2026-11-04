"use client";
import { useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LogOut } from "lucide-react";
import { panelIcons } from "@/components/panel-nav";
import { ProviderAvatar } from "@/components/provider-avatar";
import { isCurrent } from "@/lib/account-nav";
import { signOut } from "@/lib/auth/actions";
import type { AccountSummary } from "@/lib/auth/account-summary";

// O Radix cuida do papel de menu, das setas, da busca por letra, do Escape e da volta do foco ao botão.
// modal={false} evita travar a rolagem e o salto da barra lateral ao abrir.
export function AccountMenu({ account }: { account: AccountSummary }) {
  const pathname = usePathname();
  const [leaving, leave] = useTransition();
  return <Menu.Root modal={false}>
    <Menu.Trigger asChild><button type="button" className="account-trigger" aria-label={`Menu da conta de ${account.name}`}><ProviderAvatar name={account.name} photoUrl={account.photoUrl}/><ChevronDown aria-hidden="true"/></button></Menu.Trigger>
    <Menu.Portal>
      <Menu.Content className="account-menu" align="end" sideOffset={10} collisionPadding={16} loop>
        <Menu.Label className="account-menu-who"><ProviderAvatar name={account.name} photoUrl={account.photoUrl}/><span><strong>{account.name}</strong><small>{account.email}</small>{account.role && <span className="badge">{account.role}</span>}</span></Menu.Label>
        <Menu.Separator className="account-menu-line"/>
        {account.links.map((link) => {
          const Icon = panelIcons[link.icon];
          return <Menu.Item key={link.href} asChild><Link href={link.href} className="account-menu-item" aria-current={isCurrent(pathname, link.href) ? "page" : undefined}><Icon aria-hidden="true"/><span>{link.label}</span></Link></Menu.Item>;
        })}
        <Menu.Separator className="account-menu-line"/>
        {/* A saída mantém o menu aberto até redirecionar, com o retorno visível no próprio item. */}
        <Menu.Item className="account-menu-item" data-pending={leaving || undefined} onSelect={(event) => { event.preventDefault(); if (!leaving) leave(() => signOut()); }}><LogOut aria-hidden="true"/><span>{leaving ? "Saindo…" : "Sair"}</span></Menu.Item>
      </Menu.Content>
    </Menu.Portal>
  </Menu.Root>;
}

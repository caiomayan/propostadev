"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isCurrent, type SiteLink } from "@/lib/account-nav";

/** Navegação principal; marca a seção atual. */
export function SiteNav({ links }: { links: SiteLink[] }) {
  const pathname = usePathname();
  return <nav className="site-nav" aria-label="Principal">{links.map((link) => <Link key={link.href} href={link.href} aria-current={isCurrent(pathname, link.href) ? "page" : undefined}>{link.label}</Link>)}</nav>;
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const isCurrent = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

/** Navegação principal; marca a seção atual. */
export function SiteNav({ links }: { links: readonly { href: string; label: string }[] }) {
  const pathname = usePathname();
  return <nav className="site-nav" aria-label="Principal">{links.map((link) => <Link key={link.href} href={link.href} aria-current={isCurrent(pathname, link.href) ? "page" : undefined}>{link.label}</Link>)}</nav>;
}

"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";

export type SortLink = { label: string; href: string; current: boolean };

// A troca pode passar por um esqueleto que desmonta os links: o foco volta à opção escolhida em vez de cair no <body>.
let refocus: string | null = null;

/** Ordenação por links: o estado vive na URL, funciona sem JavaScript e pode ser compartilhado. */
export function SortLinks({ name, options }: { name: string; options: SortLink[] }) {
  const current = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (refocus !== name) return;
    refocus = null;
    current.current?.focus({ preventScroll: true });
  }, [name, options]);
  return <nav className="sort-links" aria-label={`Ordenar ${name}`}><p className="eyebrow">Ordenar por</p>
    <ul className="chips-row">{options.map((option) => <li key={option.label}><Link ref={option.current ? current : undefined} href={option.href} onClick={() => { refocus = name; }} className={`filter-link${option.current ? " current" : ""}`} aria-current={option.current ? "true" : undefined}>{option.label}</Link></li>)}</ul>
  </nav>;
}

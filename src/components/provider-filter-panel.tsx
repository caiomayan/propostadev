"use client";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export function FilterPanel({ children }: { children: ReactNode }) {
  return <aside className="filter-panel"><div className="desktop-filters">{children}</div><Sheet><SheetTrigger asChild><Button className="button secondary mobile-filter-button" variant="outline">Filtros e ordenação</Button></SheetTrigger>
    <SheetContent side="right" className="filter-sheet"><SheetHeader><SheetTitle>Filtros e ordenação</SheetTitle><SheetDescription>Escolha critérios para encontrar serviços.</SheetDescription></SheetHeader>{children}</SheetContent></Sheet>
  </aside>;
}

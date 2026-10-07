"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const storageKey = "proposta-comparison-offers";
const eventName = "proposta-comparison-change";
function readIds(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string" && /^[\da-f-]{36}$/i.test(id)).slice(0, 3) : [];
  } catch { return []; }
}
function writeIds(ids: string[]) {
  try { localStorage.setItem(storageKey, JSON.stringify(ids)); } catch { /* Selection remains usable with storage disabled. */ }
  window.dispatchEvent(new CustomEvent(eventName, { detail: ids }));
}

export function CompareButton({ offerId, providerId }: { offerId: string; providerId: string }) {
  const [selected, setSelected] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const sync = () => setSelected(readIds().includes(offerId));
    sync(); window.addEventListener(eventName, sync); window.addEventListener("storage", sync);
    return () => { window.removeEventListener(eventName, sync); window.removeEventListener("storage", sync); };
  }, [offerId]);
  async function toggle() {
    setPending(true); setMessage("");
    try {
      const ids = readIds();
      if (ids.includes(offerId)) { writeIds(ids.filter((id) => id !== offerId)); return; }
      const response = await fetch(`/comparar/selecoes?ofertas=${ids.join(",")}`);
      if (!response.ok) throw new Error();
      const values: { id: string; providerId: string }[] = await response.json();
      const other = values.filter((value) => value.providerId !== providerId);
      if (other.length >= 3) { setMessage("Você pode comparar até três prestadores. Remova um para adicionar outro."); return; }
      writeIds([...other.map((value) => value.id), offerId]);
      if (values.some((value) => value.providerId === providerId)) setMessage("Oferta desse prestador substituída na comparação.");
    } catch { setMessage("Não foi possível atualizar a comparação. Tente novamente."); }
    finally { setPending(false); }
  }
  return <div><Button type="button" className="button secondary" variant="outline" aria-pressed={selected} disabled={pending} onClick={toggle}>{pending ? "Atualizando…" : selected ? "Remover da comparação" : "Comparar"}</Button>{message && <p role="status" className="muted">{message}</p>}</div>;
}

export function ComparisonTray() {
  const pathname = usePathname();
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    const sync = (event?: Event) => setIds(event instanceof CustomEvent && Array.isArray(event.detail) ? event.detail : readIds());
    sync(); window.addEventListener(eventName, sync); window.addEventListener("storage", sync);
    return () => { window.removeEventListener(eventName, sync); window.removeEventListener("storage", sync); };
  }, []);
  if (!ids.length || (pathname !== "/buscar" && !pathname.startsWith("/prestadores/"))) return null;
  return <aside className="comparison-tray" aria-label="Seleção para comparação"><span>{ids.length} de 3 prestadores selecionados</span><Button asChild className="button"><Link href={`/comparar?ofertas=${ids.join(",")}`}>Ver comparação</Link></Button><Button variant="outline" className="button secondary" onClick={() => writeIds([])}>Limpar</Button></aside>;
}

export function ComparisonHydrator({ ids, hasQuery }: { ids: string[]; hasQuery: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (hasQuery) writeIds(ids);
    else {
      const stored = readIds();
      if (stored.length) router.replace(`/comparar?ofertas=${stored.join(",")}`);
    }
  }, [hasQuery, ids, router]);
  return null;
}

export function ComparisonRemove({ id, ids }: { id: string; ids: string[] }) {
  const router = useRouter();
  return <Button variant="outline" className="button secondary" onClick={() => {
    const next = ids.filter((value) => value !== id); writeIds(next);
    router.push(`/comparar?ofertas=${next.join(",")}`);
  }}>Remover</Button>;
}

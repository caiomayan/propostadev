"use client";
import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const KEY = "proposta:triagem";
// Guarda a query validada da Triagem neste navegador. Cobre o cadastro (que ainda não devolve o visitante
// à Triagem) e URLs longas demais para o redirect de login. O servidor valida de novo ao reabrir.
export function RememberDraft({ query }: { query: string }) {
  useEffect(() => { try { sessionStorage.setItem(KEY, query); } catch { /* sem armazenamento: a URL continua valendo */ } }, [query]);
  return null;
}
export function ForgetDraft() {
  useEffect(() => { try { sessionStorage.removeItem(KEY); } catch { /* ignorado */ } }, []);
  return null;
}
const subscribe = () => () => {};
const read = () => { try { return sessionStorage.getItem(KEY); } catch { return null; } };
export function ResumeDraft() {
  const query = useSyncExternalStore(subscribe, read, () => null);
  if (!query) return null;
  return <div className="panel tone stack"><h2>Continue sua Triagem</h2><p>Você deixou um projeto em andamento. Retome de onde parou e publique.</p><Link className="button" href={`/triagem?${query}`}>Continuar a Triagem <ArrowRight aria-hidden="true"/></Link></div>;
}

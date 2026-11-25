import Link from "next/link";
import type { Metadata } from "next";
import { PlataformaVipButton } from "@/components/plataforma-vip-button";
import { VipBadge } from "@/components/vip-badge";
import { requirePlataforma } from "@/lib/auth/plataforma";
import { listVipProviders, listVipRequests } from "@/modules/plataforma/queries";
import { dateLabel } from "@/modules/triage/labels";

export const metadata: Metadata = { title: "Plataforma", robots: { index: false, follow: false } };

type Row = { providerId: string; slug: string; name: string; city: string | null; state: string | null; active: boolean; requestedAt: Date | null };

function Place({ row }: { row: Row }) {
  return row.city ? <span>{row.city}{row.state ? `/${row.state}` : ""}</span> : null;
}

function List({ rows, mode, empty }: { rows: Row[]; mode: "grant" | "revoke"; empty: string }) {
  if (rows.length === 0) return <p className="muted">{empty}</p>;
  return <ul className="project-list">{rows.map((row) => <li key={row.providerId} className="project-row">
    <div><h3><Link href={`/prestadores/${row.slug}`}>{row.name}</Link></h3>
      <p className="project-meta"><Place row={row}/>{!row.active && <span>Perfil pausado</span>}{row.requestedAt && <span>Pediu em <time dateTime={row.requestedAt.toISOString()}>{dateLabel(row.requestedAt)}</time></span>}</p></div>
    <span className="chips-row">{mode === "revoke" && <VipBadge/>}<PlataformaVipButton providerId={row.providerId} name={row.name} mode={mode}/></span>
  </li>)}</ul>;
}

export default async function PlataformaPage() {
  await requirePlataforma();
  const [requests, vips] = await Promise.all([listVipRequests(), listVipProviders()]);
  return <section className="container section stack">
    <div className="page-heading"><h1>Plataforma</h1><p>Conceda ou retire o VIP dos Prestadores. O Interesse no VIP continua registrado.</p></div>
    <div className="panel stack"><h2>Pediram o VIP <span className="muted">({requests.length})</span></h2>
      <List rows={requests} mode="grant" empty="Ninguém pediu o VIP no momento."/></div>
    <div className="panel stack"><h2>VIP agora <span className="muted">({vips.length})</span></h2>
      <List rows={vips} mode="revoke" empty="Nenhum Prestador é VIP agora."/></div>
  </section>;
}

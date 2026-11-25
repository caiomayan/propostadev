import Link from "next/link";
import { Bell } from "lucide-react";
import { unreadLabel } from "@/modules/avisos/links";
import "./avisos.css";

/** Sino do cabeçalho: sempre leva à lista; o número só aparece quando há Avisos não lidos. */
export function AvisosBell({ count }: { count: number }) {
  return <Link href="/painel/avisos" className="avisos-bell" aria-label={unreadLabel(count)}>
    <Bell aria-hidden="true"/>
    {count > 0 && <span className="avisos-bell-count" aria-hidden="true">{count > 99 ? "99+" : count}</span>}
  </Link>;
}

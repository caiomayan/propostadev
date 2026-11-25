import { Crown } from "lucide-react";

/** Selo VIP: o rótulo é texto, o ícone é decorativo. */
export function VipBadge() {
  return <span className="badge vip-badge"><Crown aria-hidden="true" size={14}/>VIP</span>;
}

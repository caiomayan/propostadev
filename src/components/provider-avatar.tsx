"use client";
import { useState } from "react";

export function ProviderAvatar({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  let safeUrl: string | null = null;
  try { if (photoUrl && new URL(photoUrl).protocol === "https:") safeUrl = photoUrl; } catch { safeUrl = null; }
  // Remote profile photos load directly, without a backend image proxy.
  // eslint-disable-next-line @next/next/no-img-element
  if (safeUrl && safeUrl !== failedUrl) return <img className="provider-avatar" src={safeUrl} alt={`Foto de ${name}`} width={72} height={72} loading="lazy" referrerPolicy="no-referrer" style={{ objectFit: "cover" }} onError={() => setFailedUrl(safeUrl)}/>;
  return <span className="provider-avatar" aria-hidden="true">{name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>;
}

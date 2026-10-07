"use client";
import { useEffect, useRef, useState } from "react";

export function ProviderAvatar({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  let safeUrl: string | null = null;
  try { if (photoUrl && new URL(photoUrl).protocol === "https:") safeUrl = photoUrl; } catch { safeUrl = null; }
  useEffect(() => {
    let cancelled = false;
    const image = imageRef.current;
    if (image && safeUrl) image.decode().catch(() => {
      if (!cancelled) setFailedUrl(safeUrl);
    });
    return () => { cancelled = true; };
  }, [safeUrl]);
  // Remote profile photos load directly, without a backend image proxy.
  // eslint-disable-next-line @next/next/no-img-element
  if (safeUrl && safeUrl !== failedUrl) return <img ref={imageRef} className="provider-avatar" src={safeUrl} alt={`Foto de ${name}`} width={72} height={72} loading="lazy" referrerPolicy="no-referrer" style={{ objectFit: "cover" }} onError={() => setFailedUrl(safeUrl)}/>;
  return <span className="provider-avatar" aria-hidden="true">{name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>;
}

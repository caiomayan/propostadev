import Link from "next/link";

/** Marca: uma régua com a faixa de preço destacada + o nome. */
export function BrandMark({ className }: { className?: string }) {
  return <svg className={className ?? "wordmark-mark"} viewBox="0 0 28 28" aria-hidden="true" focusable="false"><rect className="mark-bar" x="0" y="4" width="28" height="20" rx="6"/><rect className="mark-range" x="8" y="9" width="12" height="10" rx="3"/></svg>;
}

export function Wordmark({ href = "/" }: { href?: string | null }) {
  const content = <><BrandMark/><span>Proposta<span className="wordmark-dev">.dev</span></span></>;
  return href ? <Link href={href} className="wordmark" aria-label="Proposta.dev, início">{content}</Link> : <span className="wordmark">{content}</span>;
}

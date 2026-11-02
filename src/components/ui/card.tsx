import * as React from "react"
import { cn } from "@/lib/utils"

/** Superfície base: degrau de tom sobre o fundo, sem borda nem sombra. `tone` usa o tom mais escuro; `accent` o destaque limão. */
function Card({ className, tone = "default", ...props }: React.HTMLAttributes<HTMLDivElement> & { tone?: "default" | "muted" | "accent" | "brand" }) {
  const tones = { default: "bg-card text-foreground", muted: "bg-muted text-foreground", accent: "bg-[var(--accent-fill)] text-[var(--accent-ink)]", brand: "bg-primary text-primary-foreground" }
  return <div className={cn("min-w-0 rounded-[18px] p-6 md:p-7", tones[tone], className)} {...props} />
}

export { Card }

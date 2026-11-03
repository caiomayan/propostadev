import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import "./buscar/public.css";
import "./triagem/triagem.css";
import "./acabamento.css";
import "./shell.css";
import "./home.css";
import "./motion.css";
import { ComparisonTray } from "@/components/comparison-selection";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MotionLayer } from "@/components/motion-layer";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap", axes: ["opsz", "wdth"] });
const body = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });

export const metadata: Metadata = { title: { default: "Proposta.dev — encontre desenvolvedores", template: "%s | Proposta.dev" }, description: "Descreva o que você precisa, veja quanto costuma custar e encontre desenvolvedores." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" className={`${display.variable} ${body.variable}`}><body><a className="skip-link" href="#conteudo">Pular para o conteúdo</a>{process.env.DEMO_MODE === "true" && <div className="demo-banner">Ambiente de demonstração · perfis e ofertas fictícios</div>}<SiteHeader/><main id="conteudo">{children}</main><ComparisonTray/><SiteFooter/><Suspense fallback={null}><MotionLayer/></Suspense></body></html>;
}

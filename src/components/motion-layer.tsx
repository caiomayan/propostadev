"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { startNavProgress, stopNavProgress } from "@/lib/nav-progress";

// O que entra rolando. Só recebe a marca o que está abaixo da dobra na hora da varredura: quem está visível
// já entrou com a rota, e sem JavaScript nada fica escondido.
const REVEAL = [
  ".panel", ".empty", ".proposal-card", ".provider-result", ".compatible-card", ".project-row", ".profile-offer", ".review-item",
  ".triage-card", ".data-ruler", ".catalog-reveal", ".dash-figure", ".story-copy", ".board-row", ".reveal",
].join(",");
const WAIT = "wait";

function scan(observer: IntersectionObserver) {
  const fold = window.innerHeight * 0.92;
  for (const element of document.querySelectorAll<HTMLElement>(`main :is(${REVEAL})`)) {
    // Quem já esperava volta a ser observado: o observador é recriado a cada troca de rota ou de filtro.
    if (element.dataset.rv === WAIT) { observer.observe(element); continue; }
    if (element.dataset.rv) continue;
    const top = element.getBoundingClientRect().top;
    if (top < fold) { element.dataset.rv = "seen"; continue; }
    element.dataset.rv = WAIT;
    const siblings = element.parentElement ? [...element.parentElement.children] : [];
    element.style.setProperty("--rv-delay", `${Math.min(siblings.indexOf(element), 3) * 70}ms`);
    observer.observe(element);
  }
}

/** Revelações por rolagem e barra de navegação. Sem marcação extra nas telas: tudo por seletor. */
export function MotionLayer() {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.rv = "in";
        observer.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    const main = document.querySelector("main");
    const run = () => scan(observer);
    run();
    // Conteúdo que chega depois (streaming, revalidação de Server Action) entra pela mesma varredura.
    let queued = 0;
    const mutations = new MutationObserver(() => { cancelAnimationFrame(queued); queued = requestAnimationFrame(run); });
    if (main) mutations.observe(main, { childList: true, subtree: true });
    return () => { observer.disconnect(); mutations.disconnect(); cancelAnimationFrame(queued); };
  }, [pathname, search]);

  // A rota mudou: encerra a barra.
  useEffect(() => { stopNavProgress(); }, [pathname, search]);

  // Clique em link interno e envio de formulário de busca ligam a barra e marcam o que foi acionado.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target || link.origin !== location.origin || link.hasAttribute("download")) return;
      if (link.pathname === location.pathname && link.search === location.search) return;
      startNavProgress(link);
    };
    // Só formulários GET para uma rota: os de Server Action têm retorno próprio no botão.
    const onSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement;
      if (!form.getAttribute("action")?.startsWith("/") || form.method.toLowerCase() !== "get") return;
      const target = new URL(form.action);
      const query = new URLSearchParams(new FormData(form) as unknown as Record<string, string>).toString();
      if (target.pathname === location.pathname && query === location.search.slice(1)) return;
      startNavProgress(event.submitter as HTMLElement | null);
    };
    // Na captura: o Link do Next chama preventDefault antes de um ouvinte comum no documento rodar.
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit);
    return () => { document.removeEventListener("click", onClick, true); document.removeEventListener("submit", onSubmit); stopNavProgress(); };
  }, []);

  return <><div className="route-progress" aria-hidden="true"/><p id="route-status" aria-live="polite" className="sr-only"/></>;
}

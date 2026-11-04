// Retorno de navegação sem marcação nas telas: a barra no topo, o conteúdo esmaecido e o que foi clicado em espera.
const SAFETY_MS = 12_000;
const ANNOUNCE_MS = 600;

let safety = 0;
let announce = 0;
let source: HTMLElement | null = null;

function reset() {
  window.clearTimeout(safety);
  window.clearTimeout(announce);
  if (source) delete source.dataset.navPending;
  source = null;
  const status = document.getElementById("route-status");
  if (status) status.textContent = "";
}

export function startNavProgress(element?: HTMLElement | null) {
  reset();
  document.documentElement.dataset.nav = "loading";
  document.querySelector("main")?.setAttribute("aria-busy", "true");
  if (element) { element.dataset.navPending = ""; source = element; }
  safety = window.setTimeout(stopNavProgress, SAFETY_MS); // navegação cancelada não pode prender a barra
  // Navegação rápida não gera fala; a lenta avisa quem usa leitor de tela.
  announce = window.setTimeout(() => {
    const status = document.getElementById("route-status");
    if (status) status.textContent = "Carregando…";
  }, ANNOUNCE_MS);
}

export function stopNavProgress() {
  reset();
  document.querySelector("main")?.removeAttribute("aria-busy");
  if (document.documentElement.dataset.nav === "loading") document.documentElement.dataset.nav = "done";
}

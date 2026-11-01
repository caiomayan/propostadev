/** Régua de preço decorativa: a faixa limão representa "quanto costuma custar". Sem valores; não é dado. */
export function PriceRuler() {
  const ticks = Array.from({ length: 29 }, (_, index) => index);
  return <figure className="hero-ruler"><svg className="ruler" viewBox="0 0 560 72" role="img" aria-label="Ilustração de uma régua com uma faixa de preço destacada"><rect className="range" x="150" y="8" width="230" height="36" rx="10"/>{ticks.map((tick) => <line key={tick} className="tick" x1={tick * 20 + 0} x2={tick * 20 + 0} y1={tick % 4 === 0 ? 30 : 38} y2="52"/>)}<line className="base" x1="0" x2="560" y1="52" y2="52"/></svg><figcaption className="ruler-caption">Cada serviço tem uma faixa de preço anunciada. Você vê onde o seu orçamento cai.</figcaption></figure>;
}

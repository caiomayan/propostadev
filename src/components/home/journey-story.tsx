"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

export type JourneyStep = { title: string; text: string; fragment: ReactNode };

/**
 * A jornada contada pela rolagem: o quadro fica parado e os textos passam. Sem JavaScript, ou no celular, cada texto
 * mostra o próprio quadro logo abaixo. O texto no meio da tela define o quadro ativo.
 */
export function JourneyStory({ steps }: { steps: JourneyStep[] }) {
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) setActive(items.current.indexOf(entry.target as HTMLLIElement));
    }, { rootMargin: "-45% 0px -45% 0px" });
    for (const item of items.current) if (item) observer.observe(item);
    return () => observer.disconnect();
  }, []);
  return <div className="story">
    <div className="story-stage" aria-hidden="true"><div className="story-frames">{steps.map((step, index) => <div key={step.title} className={`story-frame${index === active ? " is-on" : ""}`}>{step.fragment}</div>)}</div><p className="story-count">{active + 1} de {steps.length}</p></div>
    <ol className="story-steps">{steps.map((step, index) => <li key={step.title} ref={(element) => { items.current[index] = element; }} className={`story-step${index === active ? " is-active" : ""}`}><div className="story-copy"><h3>{step.title}</h3><p>{step.text}</p></div><div className="story-inline">{step.fragment}</div></li>)}</ol>
  </div>;
}

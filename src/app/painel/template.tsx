/** Dentro do painel a navegação lateral fica parada; só o conteúdo entra de novo. */
export default function PanelTemplate({ children }: { children: React.ReactNode }) {
  return <div className="route">{children}</div>;
}

/** Remonta a cada troca de seção do site: é o que dispara a entrada de rota (motion.css). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="route">{children}</div>;
}

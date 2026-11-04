const STARS = 5;
const PATH = "M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 16.9l-5.8 3.1 1.1-6.5L2.6 8.9l6.5-.9z";

const Star = () => <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={PATH}/></svg>;

/** Cinco estrelas preenchidas na proporção exata da nota: 4,3 enche quatro e 30% da quinta. */
export function StarRating({ value, label }: { value: number; label?: string }) {
  const rating = Math.min(STARS, Math.max(0, value));
  const accessibility = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };
  return <span className="stars" {...accessibility}>{Array.from({ length: STARS }, (_, index) => {
    const filled = Math.round(Math.min(1, Math.max(0, rating - index)) * 100);
    return <span key={index} className="star"><Star/>{filled > 0 && <span className="star-fill" style={{ width: `${filled}%` }}><Star/></span>}</span>;
  })}</span>;
}

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * Figura grande cujos dígitos rolam até o valor (CSS puro: sem JS, sem estado). O texto real fica para leitores de
 * tela e para quem copia; as colunas são só desenho. Quando `value` muda, cada coluna rola para o novo dígito.
 */
export function RollingFigure({ value, className }: { value: string; className?: string }) {
  let column = 0;
  return <span className={`roll${className ? ` ${className}` : ""}`}>
    <span className="sr-only">{value}</span>
    <span className="roll-digits" aria-hidden="true">{[...value].map((char, index) => {
      if (!/\d/.test(char)) return <span key={`c${index}`} className="roll-char">{char}</span>;
      const style = { "--d": char, "--c": column++ } as React.CSSProperties;
      return <span key={index} className="roll-col"><span className="roll-strip" style={style}>{DIGITS.map((digit) => <span key={digit}>{digit}</span>)}</span></span>;
    })}</span>
  </span>;
}
